import crypto from 'crypto';

const CHUNK_SIZE = 20;

export default function calcDiffData (localFileContent, fileContent) {
  let result = {};
  result.m = true;
  result.l = CHUNK_SIZE;

  let diffDataArray = [];
  if (md5(localFileContent) === md5(fileContent)) {
    result.m = false;
    result.c = diffDataArray;
    return result;
  }

  const localMd5Map = checksum(localFileContent, CHUNK_SIZE);
  const diffArray = roll(fileContent, localMd5Map, CHUNK_SIZE);
  let arrayData = '';
  let lastItem = null;
  let matchedCount = 0;
  for (let i = 0, size = diffArray.length; i < size; i++) {
    let item = diffArray[i];
    if (item.match) {
      if (lastItem == null || !lastItem.match) {
        arrayData = `[${item.data},`;
        matchedCount = 1;
      } else if (lastItem.match && (lastItem.data + 1) === item.data) {
        matchedCount++;
      } else if (lastItem.match && (lastItem.data + 1) !== item.data) {
        arrayData += `${matchedCount}]`;
        diffDataArray.push(JSON.parse(arrayData));
        arrayData = `[${item.data},`;
        matchedCount = 1;
      }

      if (i === (size - 1)) {
        arrayData += `${matchedCount}]`;
        diffDataArray.push(JSON.parse(arrayData));
        arrayData = '';
      }
    } else {
      if (matchedCount > 0) {
        arrayData += `${matchedCount}]`;
        diffDataArray.push(JSON.parse(arrayData));
        arrayData = '';
        matchedCount = 0;
      }
      const data = item.data;
      diffDataArray.push(data);
    }
    lastItem = item;
  }

  result.c = diffDataArray;
  return result;
}

function roll (content, localMd5Map, chunkSize) {
  let diffDataArray = [];
  let buffer = '';
  let outBuffer = '';
  let currentIndex = 0;
  const len = content.length;
  let lastMatchNo = 0;

  while (currentIndex <= len) {
    let endIndex = currentIndex + chunkSize;
    if (endIndex > len) {
      endIndex = len;
    }
    buffer = content.substring(currentIndex, endIndex);
    const chunkMd5 = md5(buffer);
    const matchedNo = findMatchedNo(chunkMd5, localMd5Map, lastMatchNo);

    if (endIndex > len - 1) {
      if (outBuffer.length > 0 && outBuffer !== '') {
        diffDataArray.push({
          match: false,
          data: outBuffer
        });
        outBuffer = '';
      }
      if (buffer.length > 0 && buffer !== '') {
        diffDataArray.push({
          match: false,
          data: buffer
        });
      }
      currentIndex = currentIndex + chunkSize;
    } else if (matchedNo >= 0) {
      if (outBuffer.length > 0 && outBuffer !== '') {
        diffDataArray.push({
          match: false,
          data: outBuffer
        });
        outBuffer = '';
      }

      diffDataArray.push({
        match: true,
        data: matchedNo
      });
      currentIndex = currentIndex + chunkSize;
    } else {
      outBuffer = outBuffer + content.substring(currentIndex, currentIndex + 1);
      currentIndex++;
    }

    if (matchedNo >= 0) {
      lastMatchNo = matchedNo;
    }
  }
  return diffDataArray;
}

function checksum (content, chunkSize) {
  const md5Map = {};
  let index = 0;
  const len = content.length;
  let chunkNo = 0;
  while (index < len) {
    const chunkString = content.substr(index, chunkSize);
    const chunkMd5 = md5(chunkString);
    let numArray = md5Map[chunkMd5];
    if (!numArray) {
      numArray = [];
    }
    numArray.push(chunkNo);
    md5Map[chunkMd5] = numArray;
    index = index + chunkSize;
    chunkNo++;
  }
  return md5Map;
}

function findMatchedNo (chunkMd5, localMd5Map, lastMatchNo) {
  let numArray = localMd5Map[chunkMd5];
  if (!numArray) {
    return -1;
  } else {
    if (numArray.length === 1) {
      return numArray[0];
    } else {
      let lastNo = numArray[0];
      let resultNo = 0;
      for (let i = 0; i < numArray.length; i++) {
        let no = numArray[i];
        if (no >= lastMatchNo && lastNo <= lastMatchNo) {
          return (lastMatchNo - lastNo) >= (no - lastMatchNo) ? no : lastNo;
        } else if (no >= lastMatchNo && lastNo >= lastMatchNo) {
          return lastNo;
        } else if (no <= lastMatchNo && lastNo <= lastMatchNo) {
          resultNo = no;
        } else {
          resultNo = no;
        }
        lastNo = no;
      }
      return resultNo;
    }
  }
}

function md5 (content) {
  const md5 = crypto.createHash('md5');
  md5.update(content);
  return md5.digest('hex');
}
