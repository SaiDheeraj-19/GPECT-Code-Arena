const Jimp = require('jimp');

async function removeWhiteBg() {
    try {
        const image = await Jimp.read('public/college-logo.png');

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];

            // Look for pure white or near white
            if (red > 240 && green > 240 && blue > 240) {
                // Set alpha to 0 (transparent)
                this.bitmap.data[idx + 3] = 0;
            }
        });

        await image.writeAsync('public/college-logo.png');
        console.log("Transformed logo background successfully!");
    } catch (err) {
        console.error("Error modifying image:", err);
    }
}

removeWhiteBg();
