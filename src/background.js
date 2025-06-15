import Tesseract from 'tesseract.js';

chrome.storage.sync.get((config) => {
    if (!config.method) {
        chrome.storage.sync.set({ method: 'crop' })
    }
    if (!config.format) {
        chrome.storage.sync.set({ format: 'png' })
    }
    if (config.dpr === undefined) {
        chrome.storage.sync.set({ dpr: true })
    }
})

function inject(tab) {
    chrome.tabs.sendMessage(tab.id, { message: 'init' }, (res) => {
        if (res) {
            clearTimeout(timeout)
        }
    })

    var timeout = setTimeout(() => {
        chrome.tabs.insertCSS(tab.id, { file: 'vendor/jquery.Jcrop.min.css', runAt: 'document_start' })
        chrome.tabs.insertCSS(tab.id, { file: 'src/css/content.css', runAt: 'document_start' })

        chrome.tabs.executeScript(tab.id, { file: 'vendor/jquery.min.js', runAt: 'document_start' })
        chrome.tabs.executeScript(tab.id, { file: 'vendor/jquery.Jcrop.min.js', runAt: 'document_start' })
        chrome.tabs.executeScript(tab.id, { file: 'src/content_scripts/content.js', runAt: 'document_start' })

        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { message: 'init' })
        }, 100)
    }, 100)
}


//1. Called when we click the icon in the tools
chrome.browserAction.onClicked.addListener((tab) => {
    inject(tab)
})

chrome.commands.onCommand.addListener((command) => {
    if (command === 'take-screenshot') {
        chrome.tabs.getSelected(null, (tab) => {
            inject(tab)
        })
    }
    else if (command === 'activate-ocr') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            inject(tabs[0]);
        });
    }
})

chrome.runtime.onMessage.addListener((req, sender, res) => {
    if (req.message === 'capture') {
        chrome.storage.sync.get((config) => {

            chrome.tabs.getSelected(null, (tab) => {

                chrome.tabs.captureVisibleTab(tab.windowId, { format: config.format }, (image) => {
                    crop(image, req.area, req.dpr, config.dpr, config.format, tab, config.lang, (cropped) => {
                        res({ message: 'extracted' })
                    })
                })
            })
        })
    }
    else if (req.message === 'active') {
        if (req.active) {
            chrome.storage.sync.get((config) => {
                if (config.method === 'crop') {
                    chrome.browserAction.setTitle({ tabId: sender.tab.id, title: 'Select region' })
                    chrome.browserAction.setBadgeText({ tabId: sender.tab.id, text: '⯐' })
                }
            })
        }
        else {
            chrome.browserAction.setTitle({ tabId: sender.tab.id, title: 'Copy text from image' })
            chrome.browserAction.setBadgeText({ tabId: sender.tab.id, text: '' })
        }
    }
    else if (req.message === 'uploadImageForOcr') {
        Tesseract.recognize(req.imageData, {
            lang: req.lang || 'eng'
        })
        .then(function (result) {
            let cleanedText = result.text.replace(/[""]/g, '"')
                                         .replace(/['']/g, "'")
                                         .replace(/–/g, '-')
                                         .replace(/\r\n/g, '\n');

            // Store extracted text in history
            chrome.storage.local.get({ ocrHistory: [] }, (res) => {
                const history = res.ocrHistory;
                history.unshift(cleanedText); // Add to the beginning
                if (history.length > 10) { // Keep only the last 10 items
                    history.pop();
                }
                chrome.storage.local.set({ ocrHistory: history });
            });

            // Send the cleaned text to the options page for preview
            chrome.runtime.sendMessage({ message: 'ocrText', text: cleanedText });
        });
    }
    return true
})

function crop(image, area, dpr, preserve, format, tab, lang, done) {
    var top = area.y * dpr
    var left = area.x * dpr
    var width = area.w * dpr
    var height = area.h * dpr
    var w = (dpr !== 1 && preserve) ? width : area.w
    var h = (dpr !== 1 && preserve) ? height : area.h

    var canvas = null
    if (!canvas) {
        canvas = document.createElement('canvas')
        document.body.appendChild(canvas)
    }
    canvas.width = w
    canvas.height = h

    var img = new Image()
    img.onload = () => {
        var context = canvas.getContext('2d')
        context.drawImage(img,
            left, top,
            width, height,
            0, 0,
            w, h
        )

        var cropped = canvas.toDataURL(`image/${format}`)

        Tesseract.recognize(cropped, {
            lang: lang || 'eng'
        })
            .then(function (result) {
                let cleanedText = result.text.replace(/[""]/g, '"')
                                             .replace(/['']/g, "'")
                                             .replace(/–/g, '-')
                                             .replace(/\r\n/g, '\n');

                chrome.tabs.sendMessage(tab.id, { message: 'loaded' }, (res) => {
                    if (res) {
                        clearTimeout(timeout)
                    }
                })

                // Store extracted text in history
                chrome.storage.local.get({ ocrHistory: [] }, (result) => {
                    const history = result.ocrHistory;
                    history.unshift(cleanedText); // Add to the beginning
                    if (history.length > 10) { // Keep only the last 10 items
                        history.pop();
                    }
                    chrome.storage.local.set({ ocrHistory: history });
                });

                // Send the cleaned text to the options page for preview
                chrome.runtime.sendMessage({ message: 'ocrText', text: cleanedText });
            });


        done(cropped)
    };
    img.src = image
}
