const fse = require("fs-extra");
const path = require("path");

module.exports = async function hdrunpack(hdrFile) {
  let outputDir = path.resolve(path.dirname(hdrFile), "./output");
  let srcFile = path.resolve(
    path.dirname(hdrFile),
    path.basename(hdrFile, ".hdr") + ".src"
  );
  let start = Date.now();

  let fd;
  try {
    fd = await fse.open(hdrFile, "r");
  } catch (e) {
    throw new Error("hdr file could not found! (" + hdrFile + ")");
  }

  let total = await readInteger(fd);
  let newVersion = total & 0xff0000;

  total &= 0xffff;

  if (total > 16000) {
    throw new Error(
      "this file does not look like hdr! record count should be less than 16000 and it is " +
        total +
        " (" +
        hdrFile +
        ")"
    );
  }

  if (newVersion) {
    await readInteger(fd);
  }

  let files = [];
  for (let i = 0; i < total; i++) {
    let nameLength = newVersion ? await readShort(fd) : await readInteger(fd);

    if (nameLength > 2048) {
      throw new Error(
        "this file does not look like hdr! name length should be less than 2048 and it is " +
          nameLength +
          " (" +
          hdrFile +
          ")"
      );
    }

    let name = await readString(fd, nameLength);
    let data = await readBuffer(fd, 8);
    let offset = data.readUInt32LE(0);
    let size = data.readUInt32LE(4);
    files.push({ name, offset, size });
  }

  await fse.close(fd); // close .hdr file
  try {
    fd = await fse.open(srcFile, "r");
  } catch (e) {
    throw new Error("src file could not found! " + srcFile);
  }
  await fse.ensureDir(outputDir);

  let size = 0;
  let step = Math.max(1, parseInt(total / 20));

  for (let i = 0; i < total; i++) {
    let file = files[i];
    size += file.size;

    let buffer = await readBuffer(fd, file.size, file.offset);
    let location = path.resolve(outputDir, file.name);
    await fse.outputFile(location, buffer);

    if (i % step == 0) {
      console.log(parseInt(((i + 1) / total) * 1000) / 10 + "%");
    }
  }

  await fse.close(fd);

  let stat = await fse.stat(srcFile);

  console.log(
    "all files are unpacked! (" + (Date.now() - start) + " ms) total: " + total
  );

  if (stat.size - size > 0) {
    console.log(
      "WARNING: Source file has " +
        sizeToText(stat.size - size) +
        " unnecessary data."
    );
  }
};

async function readInteger(fd) {
  let buffer = Buffer.allocUnsafe(4);
  await fse.read(fd, buffer, 0, 4);
  return buffer.readUInt32LE(0);
}

async function readShort(fd) {
  let buffer = Buffer.allocUnsafe(2);
  await fse.read(fd, buffer, 0, 2);
  return buffer.readUInt16LE(0);
}

async function readString(fd, length) {
  let buffer = Buffer.allocUnsafe(length);
  await fse.read(fd, buffer, 0, length);
  return buffer.toString();
}

async function readBuffer(fd, length, position) {
  let buffer = Buffer.allocUnsafe(length);
  await fse.read(fd, buffer, 0, length, position);
  return buffer;
}

function sizeToText(n) {
  if (n < 1024) return n + " byte";
  if (n < 1024 * 1024) return parseInt((n / 1024) * 100) / 100 + " kb";
  if (n < 1024 * 1024 * 1024)
    return parseInt((n / 1024 / 1024) * 100) / 100 + " mb";
  return parseInt((n / 1024 / 1024 / 1024) * 100) / 100 + " gb";
}
