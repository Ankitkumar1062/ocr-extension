# OCR Extension - Copy Text from Images


OCR Extension is a chrome extension to copy text from images using the best open source OCR engine [Tesseract.js](https://github.com/naptha/tesseract.js).

As a developer you don't always find the code in text format, quite often it's another one:
* Video format - youtube / pluralsight tutorial.
* Image format - from lazy friends or lazy bloggers.

In every instance you need to write it down character by character.
Using OCR Extension you can just select the area with the text and let Tesseract extract the text, as shown below.


## Using OCR Extension

Once installed, the usage is simple:

1. Click the icon ![OCR Extension icon](./images/icon16.png).
2. Crop the area containing the text.
__Wait until Tesseract recognizes the text... and done!__
3. The text is in your clipboard. `Ctrl + V` to paste it!

## Building OCR Extension

Once you clone the codebase in the root directory execute:
```bash
$ npm install
$ npm run webpack
```
Webpack will bundle the Javascript files into `./dist/main.js` which will be used as starting point for the extension.

### Loading OCR Extension into the browser

1. Enter in the Address bar `chrome://extensions`.
2. Click `Load unpacked` and select the root folder.

Done!

## Credits

This tool is build with help of:
* Tesseract.js - does the actual OCR:

## Feedback

* Request features or file bugs on [GitHub](https://github.com/Ankitkumar1062/ocr-extension/issues/new).

## License

Copyright (c) 2024 Ankitkumar.
