const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MAX_COLS = 16;
const SPRITE_SIZE = 64;

const PATH = `./`;

// Read directory
fs.readdir(PATH, {encoding: 'utf8'}, (err, dirs) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // filter invalid directories, and then for each directory
  dirs.filter(dir => !['.git', 'sprites', 'README.md'].includes(dir)).forEach(dir =>
    // Read again the content of the sub directory
    fs.readdir(path.join(PATH, dir), {encoding: 'utf8'}, (err_, files) => {
      if (err_) {
        console.log(err);
        process.exit(1);
      }

      // for each iamge in the subdirectory, create a small resized image with transparent background
      const buffers = files.map(file =>
        sharp(path.join(PATH, dir, file))
          .resize(SPRITE_SIZE, SPRITE_SIZE, {fit: 'contain', background: {r: 255, g: 255, b: 255, alpha: 0}})
          .toBuffer()
      );

      Promise.all(buffers).then(buffers => {
        let row = 0;

        const sprites = [];

        // create smaller arrays containing 16 images
        while (buffers.length > 0) {
          sprites.push(...buffers
            .splice(0, 16)
            .map((buffer, idx) => ({
                input: buffer,
                top: row * SPRITE_SIZE,
                left: idx * SPRITE_SIZE
              })
            )
          );
          row++;
        }

        const rowBuffer = [];

        // now for each array with 16 images, create a row
        while (sprites.length > 0) {
          rowBuffer.push(sharp({
            create: {
              width: MAX_COLS * SPRITE_SIZE,
              height: SPRITE_SIZE,
              channels: 3,
              background: {r: 255, g: 255, b: 255, alpha: 0}
            }
          }).png().composite(sprites.splice(0, MAX_COLS)).toBuffer());
        }

        // finally, create a bigger image containing all of the created rows
        Promise.all(rowBuffer).then(rowBuffers =>
          sharp({
            create: {
              width: MAX_COLS * SPRITE_SIZE,
              height: rowBuffers.length * SPRITE_SIZE,
              channels: 3,
              background: {r: 255, g: 255, b: 255}
            }
          }).png()
            .composite(rowBuffers.map((b, i) => ({
              input: b,
              top: i * SPRITE_SIZE,
              left: 0
            })))
            .toFile(`sprites/${dir}.png`, err => {
              console.log(err);
            }));

      });
    })
  );
});






