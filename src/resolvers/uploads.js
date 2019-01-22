const shortid = require('shortid');
const fs = require('fs');
const storeFS = ({ stream, filename }) => {
  const id = shortid.generate();
  const path = `images/${id}-${filename}`;
  return new Promise((resolve, reject) =>
    stream
      .on('error', error => {
        if (stream.truncated)
          // Delete the truncated file.
          fs.unlinkSync(path);
        reject(error);
      })
      .pipe(fs.createWriteStream(path))
      .on('error', error => reject(error))
      .on('finish', () => resolve({ id, path }))
  );
};

const processUpload = async upload => {
  const { createReadStream, filename, mimetype } = await upload;
  const stream = createReadStream();
  const { id, path } = await storeFS({ stream, filename });
  return id;
};

module.exports = {
  Mutation: {
    async uploadFile(parent, { file }) {
      const resp = await processUpload(file);

      // 1. Validate file metadata.

      // 2. Stream file contents into cloud storage:
      // https://nodejs.org/api/stream.html

      // 3. Record the file upload in your DB.
      // const id = await recordFile( … )

      return true;
    },
  },
};
