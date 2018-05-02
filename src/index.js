import crypto from 'crypto';

const CHUNK_SIZE = 20;

export default function calcDiffData (srcFileContent, destFileContent) {
  let result = {};
  result.m = true;
  result.l = CHUNK_SIZE;

  let diffDataArray = [];
  if (md5(srcFileContent) === md5(destFileContent)) {
    result.m = false;
    result.c = diffDataArray;
    return result;
  }

  const md5Map = checksum(srcFileContent);
  const diffArray = roll(destFileContent, md5Map);
  let arrayData = '';
  let lastItem = null;
  let matchedCount = 0;
  for (let i = 0, len = diffArray.length; i < len; i++) {
    let item = diffArray[i];
    if (item.matched) {
      if (lastItem == null || !lastItem.matched) {
        arrayData = `[${item.data},`;
        matchedCount = 1;
      } else if (lastItem.matched && (lastItem.data + 1) === item.data) {
        matchedCount++;
      } else if (lastItem.matched && (lastItem.data + 1) !== item.data) {
        arrayData += `${matchedCount}]`;
        diffDataArray.push(JSON.parse(arrayData));
        arrayData = `[${item.data},`;
        matchedCount = 1;
      }

      if (i === len - 1) {
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

function roll (content, md5Map) {
  let diffDataArray = [];
  let chunkVal = '';
  let diffVal = '';
  let current = 0;
  const len = content.length;
  let lastMatchedNo = 0;

  while (current <= len) {
    let end = current + CHUNK_SIZE;
    if (end > len) {
      end = len;
    }

    chunkVal = content.substring(current, end);
    const chunkMd5 = md5(chunkVal);
    const matchedNo = findMatchedNo(chunkMd5, md5Map, lastMatchedNo);

    if (end > len - 1) {
      if (diffVal.length > 0) {
        diffDataArray.push({
          matched: false,
          data: diffVal
        });
        diffVal = '';
      }
      if (chunkVal.length > 0) {
        diffDataArray.push({
          matched: false,
          data: chunkVal
        });
      }
      current = current + CHUNK_SIZE;
    } else {
      if (matchedNo >= 0) {
        if (diffVal.length > 0) {
          diffDataArray.push({
            matched: false,
            data: diffVal
          });
          diffVal = '';
        }

        diffDataArray.push({
          matched: true,
          data: matchedNo
        });
        current = current + CHUNK_SIZE;
      } else {
        diffVal = diffVal + content.substring(current, current + 1);
        current++;
      }

      if (matchedNo >= 0) {
        lastMatchedNo = matchedNo;
      }
    }
  }
  return diffDataArray;
}

function checksum (content) {
  const md5Map = {};
  let index = 0;
  const len = content.length;
  let chunkNo = 0;
  while (index < len) {
    const chunkString = content.substr(index, CHUNK_SIZE);
    const chunkMd5Val = md5(chunkString);
    let numArray = md5Map[chunkMd5Val];
    if (!numArray) {
      numArray = [];
    }
    numArray.push(chunkNo);
    md5Map[chunkMd5Val] = numArray;
    index = index + CHUNK_SIZE;
    chunkNo++;
  }
  return md5Map;
}

function findMatchedNo (chunkMd5, md5Map, lastMatchedNo) {
  let numArray = md5Map[chunkMd5];
  if (numArray) {
    if (numArray.length === 1) {
      return numArray[0];
    } else {
      let lastNo = numArray[0];
      let resultNo = 0;
      for (let i = 0, len = numArray.length; i < len; i++) {
        let no = numArray[i];
        if (no >= lastMatchedNo && lastNo <= lastMatchedNo) {
          return (lastMatchedNo - lastNo) >= (no - lastMatchedNo) ? no : lastNo;
        } else if (no >= lastMatchedNo && lastNo >= lastMatchedNo) {
          return lastNo;
        } else if (no <= lastMatchedNo && lastNo <= lastMatchedNo) {
          resultNo = no;
        } else {
          resultNo = no;
        }
        lastNo = no;
      }
      return resultNo;
    }
  } else {
    return -1;
  }
}

function md5 (content) {
  const md5 = crypto.createHash('md5');
  md5.update(content);
  return md5.digest('hex');
}
