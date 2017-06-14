const Faced = require('faced');
const faced = new Faced();
const smartcrop = require('smartcrop-sharp');

function detect(image, width, height) {
  return new Promise((resolve) => {
    faced.detect(image, (faces) => {
      const options = {
        width: width,
        height: height,
      };

      if (faces) {
        options.boost = faces.map(each => ({
          x: each.getX(),
          y: each.getY(),
          width: each.getWidth(),
          height: each.getHeight(),
          weight: 1.0,
        }));
      }

      smartcrop.crop(image, options).then((result) => {
        const crop = result.topCrop;
        resolve({
          width: crop.width,
          height: crop.height,
          left: crop.x,
          top: crop.y,
        });
      });
    });
  });
}

module.exports = detect;
