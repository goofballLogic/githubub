const fs = require("fs");
const path = require("path");

module.exports = {
    async build() {
        return await new Promise((resolve, reject) => {
            fs.readdir(path.resolve(__dirname, "./queries"), async (err, files) => {
                if(err) {
                    reject(err);
                } else {
                    const data = await Promise.all(files.map(readFileContent));
                    const index = {};
                    files.forEach((file, i) => {
                        const name = file.replace(/\.graphql$/, "");
                        index[name] = data[i].toString();
                    });
                    resolve(index);
                }
            });
        });
    }
};
async function readFileContent(fileName) {
    if (!fileName)
        throw new Error("Required fileName null or empty");
    const filePath = path.resolve(__dirname, "./queries", fileName);
    return await new Promise((resolve, reject) =>
        fs.readFile(filePath, (err, data) => err ? reject(err) : resolve(data))
    );
}

