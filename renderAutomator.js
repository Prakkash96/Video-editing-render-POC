var fs = require('fs');
const path = require('path');
const async = require('async');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');

function writeVideoBufferToFile(videoBuffer, filePath) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, videoBuffer, (error) => {
            if (error) {
                console.error('Error writing video buffer to file:', error);
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

async function getInputData() {
    try {
        function readFileAsync(filePath) {
            return new Promise((resolve, reject) => {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data);
                });
            });
        }
        const jsonData = await readFileAsync('test2.json');
        const parsedData = JSON.parse(jsonData);
        return parsedData;
    } catch (error) {
        console.error('Error reading JSON file:', error);
    }
}

async function getWorkSpaceBGAsArrayOfObj(data) {
    const arrayOfObjects = Object.entries(data).map(([id, obj]) => ({ id, ...obj }));
    return arrayOfObjects;
}

async function downloadSourceBufferFromURL(videoURL) {
    const downloadVideo = async (url) => {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data, 'binary');
        } catch (error) {
            throw new Error(`Failed to download video: ${error.message}`);
        }
    };

    try {
        const sourceBuffer = await downloadVideo(videoURL);
        return sourceBuffer;
    } catch (error) {
        console.error('Error downloading source :', error);
    }

    return;
}

function trimVideoLength(inputBuffer, startTime, endTime) {
    return new Promise((resolve, reject) => {
        const outputPath = './temp/trimmed-video2.mp4';

        fs.writeFile('./temp/temp-video2.mp4', inputBuffer, (err) => {
            if (err) {
                reject(err);
                return;
            }

            ffmpeg('./temp/temp-video2.mp4')
                .setStartTime(startTime)
                .setDuration(endTime - startTime)
                .output(outputPath)
                .outputOptions('-acodec copy')
                .on('end', () => {
                    fs.readFile(outputPath, (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }

                        // fs.unlink('./temp-video.mp4', () => { });
                        // fs.unlink(outputPath, () => { });
                    });
                })
                .on('error', (err) => reject(err))
                .run();
        });
    });
}

function adjustSoundSettings(inputBuffer, volume) {
    return new Promise((resolve, reject) => {
        const outputPath = './temp/trimmed-video2.mp4';

        fs.writeFile('./temp/temp-video2.mp4', inputBuffer, (err) => {
            if (err) {
                reject(err);
                return;
            }

            ffmpeg('./temp/temp-video2.mp4')
                .output(outputPath)
                .audioFilter(`volume=${volume / 100}`)
                .on('end', () => {
                    fs.readFile(outputPath, (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }

                        // fs.unlink('./temp-video2.mp4', () => { });
                        // fs.unlink(outputPath, () => { });
                    });
                })
                .on('error', (err) => reject(err))
                .run();
        });
    });
}

function flipVideo(inputBuffer) {
    return new Promise((resolve, reject) => {
        const outputPath = './temp/trimmed-video2.mp4';

        fs.writeFile('./temp/temp-video2.mp4', inputBuffer, (err) => {
            if (err) {
                reject(err);
                return;
            }

            ffmpeg('./temp/temp-video2.mp4')
                .outputOptions('-vf', 'hflip')
                .output(outputPath)
                .on('end', () => {
                    fs.readFile(outputPath, (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }

                        // fs.unlink('./temp-video2.mp4', () => { });
                        // fs.unlink(outputPath, () => { });
                    });
                })
                .on('error', (err) => reject(err))
                .run();
        });
    });
}

function cropVideo(inputBuffer, cropAngle) {
    return new Promise((resolve, reject) => {
        const outputPath = './temp/trimmed-video2.mp4';

        fs.writeFile('./temp/temp-video2.mp4', inputBuffer, (err) => {
            if (err) {
                reject(err);
                return;
            }

            ffmpeg('./temp/temp-video2.mp4')
                .output(outputPath)
                .videoFilter(`crop=${cropAngle.width}:${cropAngle.height}:${cropAngle.x}:${cropAngle.y}`)
                .outputOptions('-c:a copy')
                .on('end', () => {
                    fs.readFile(outputPath, (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }

                        // fs.unlink('./temp-video2.mp4', () => { });
                        // fs.unlink(outputPath, () => { });
                    });
                })
                .on('error', (err) => reject(err))
                .run();
        });
    });
}

function scaleVideo(inputBuffer, projectWidth, projectHeight) {
    return new Promise((resolve, reject) => {
        const outputPath = './temp/trimmed-video2.mp4';
        const newResolution = projectWidth + 'x' + projectHeight;

        fs.writeFile('./temp/temp-video2.mp4', inputBuffer, (err) => {
            if (err) {
                reject(err);
                return;
            }
            ffmpeg('./temp/temp-video2.mp4')
                .outputOptions('-vf', `scale=${newResolution}`)
                .output(outputPath)
                .on('end', () => {
                    fs.readFile(outputPath, (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }
                        // fs.unlink('./temp-video2.mp4', () => { });
                        // fs.unlink(outputPath, () => { });
                    });
                })
                .on('error', (err) => reject(err))
                .run();
        });
    });
}

function getFrameRate() {
    const videoPath = './temp/trimmed-video2.mp4';
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }

            const { format } = metadata;
            if (!format || !format.duration || !format.nb_streams) {
                reject(new Error('Invalid video metadata.'));
                return;
            }

            const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video');
            if (!videoStream || !videoStream.avg_frame_rate) {
                reject(new Error('Unable to find video frame rate.'));
                return;
            }

            const frameRate = videoStream.avg_frame_rate;
            resolve(frameRate);
        });
    });
}

function changeFrameRate(inputBuffer) {
    var newFrameRate = 30;
    return new Promise((resolve, reject) => {
        const outputPath = './temp/trimmed-video2.mp4';

        fs.writeFile('./temp/temp-video2.mp4', inputBuffer, (err) => {
            if (err) {
                reject(err);
                return;
            }

            ffmpeg('./temp/temp-video2.mp4')
                .outputOptions(`-r ${newFrameRate}`)
                .output(outputPath)
                .on('end', () => {
                    fs.readFile(outputPath, (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }

                        // fs.unlink('./temp-video2.mp4', () => { });
                        // fs.unlink(outputPath, () => { });
                    });
                })
                .on('error', (err) => reject(err))
                .run();
        });
    });
}

function writeFilePromise(file, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, data, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function mergeFilesFromList(tempDirForMergeFilesList) {
    return new Promise((resolve, reject) => {
        const outputPath = './temp/trimmed-video2.mp4';
        ffmpeg()
            .input(tempDirForMergeFilesList)
            .inputOptions('-f concat')
            .outputOptions('-c copy')
            .output(outputPath)
            .on('end', () => {
                fs.readFile(outputPath, (err, data) => {
                    if (err)
                        reject(err);
                    else {
                        console.log('Video merging completed!');
                        resolve(data);
                    }
                    // fs.unlink('./temp-video2.mp4', () => { });
                    // fs.unlink(outputPath, () => { });
                });
            })
            .on('error', (err) => {
                reject(err);
            })
            .run();
    });
}

async function mergeVideos(textFile) {
    try {
        var tempDirForMergeFilesList = './temp/mergeFileList.txt';
        await writeFilePromise(tempDirForMergeFilesList, textFile);
        var processedBuffer = await mergeFilesFromList(tempDirForMergeFilesList);
        return processedBuffer;
    } catch (err) {
        console.error('Error writing to file:', err);
    }
}

function overlayVideo(mainVideoBuffer, overlayVideoBuffer, x, y, width, height, startTime, endTime) {
    return new Promise((resolve, reject) => {
        var mainVideoPath = './temp/workSpace_video.mp4';
        const outputPath = './temp/trimmed-video2.mp4';
        fs.writeFile(mainVideoPath, mainVideoBuffer, (err) => {
            if (err) {
                reject(err);
                return;
            }
            fs.writeFile('./temp/temp-video2.mp4', overlayVideoBuffer, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                ffmpeg()
                    .input(mainVideoPath)
                    .input('./temp/temp-video2.mp4')
                    .complexFilter([
                        `[1:v]scale=${width}:${height}[overlay]`,
                        `[0:v][overlay]overlay=x=${x}:y=${y}:enable='between(t,${startTime},${endTime})'[outv]`,
                        `[0:a][1:a]amix=inputs=2[aout]`
                    ])
                    .outputOptions('-map', '[outv]')
                    .outputOptions('-map', '[aout]')
                    .output(outputPath)
                    .on('end', () => {
                        fs.readFile(outputPath, (err, data) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(data);
                            }
                        });
                    })
                    .on('error', (err) => {
                        console.error('An error occurred:', err.message);
                        reject(err)
                    })
                    .run();
            });
        });
    });
}

function clearDirectory(directoryPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                reject(err);
                return;
            }

            const unlinkPromises = files.map((file) => {
                const filePath = path.join(directoryPath, file);
                return fs.promises.unlink(filePath);
            });

            Promise.all(unlinkPromises)
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        });
    });
}

async function validateAndTrimVideoLength(sourceBuffer, workSpaceBGObj) {
    if (workSpaceBGObj.videoStart != 0 || workSpaceBGObj.videoEnd != workSpaceBGObj.videoDuration) {
        var processedVideoBuffer = await trimVideoLength(sourceBuffer, workSpaceBGObj.videoStart, workSpaceBGObj.videoEnd);
        return processedVideoBuffer;
    }
    return sourceBuffer;
}

async function validateAndAdjustSoundSettings(sourceBuffer, workSpaceBGObj) {
    if (workSpaceBGObj.volume != 100) {
        var processedVideoBuffer = await adjustSoundSettings(sourceBuffer, workSpaceBGObj.volume);
        return processedVideoBuffer;
    }
    return sourceBuffer;
}

async function validateAndFlipVideo(sourceBuffer, workSpaceBGObj) {
    if (workSpaceBGObj.flipPosition) {
        var processedVideoBuffer = await flipVideo(sourceBuffer);
        return processedVideoBuffer;
    }
    return sourceBuffer;
}

async function validateAndCropVideo(sourceBuffer, workSpaceBGObj, projectWidth, projectHeight) {
    var cropAngle = {
        x: workSpaceBGObj.x,
        y: workSpaceBGObj.y,
        width: projectWidth * workSpaceBGObj.width,
        height: projectHeight * workSpaceBGObj.height
    };
    if (cropAngle.x < 0) cropAngle.x = 0;
    if (cropAngle.y < 0) cropAngle.y = 0;
    if (cropAngle.x + cropAngle.width > projectWidth) cropAngle.width = projectWidth - cropAngle.x;
    if (cropAngle.y + cropAngle.height > projectHeight) cropAngle.height = projectHeight - cropAngle.y;

    if (cropAngle.x != 0 || cropAngle.y != 0 || cropAngle.width != projectWidth || cropAngle.height != projectHeight)
        sourceBuffer = await cropVideo(sourceBuffer, cropAngle);

    return sourceBuffer;
}

async function validateScale(sourceBuffer, workSpaceBGObj, projectWidth, projectHeight) {
    if (projectWidth != workSpaceBGObj.pwidth || projectHeight != workSpaceBGObj.pheight) {
        sourceBuffer = await scaleVideo(sourceBuffer, projectWidth, projectHeight);
    }
    return sourceBuffer;
}

async function validateFrameRate(sourceBuffer) {
    var frameRate = await getFrameRate();
    if (frameRate != '30/1') {
        sourceBuffer = await changeFrameRate(sourceBuffer);
    }
    return sourceBuffer;
}

async function mergeWorkSpaceBGVideos(sourceBufferArray) {
    const tempFilePaths = [];
    var textFile = '';
    for (const [i, sourceBufferObj] of sourceBufferArray.entries()) {
        const tempFilePath = `./temp/temp${i}.mp4`;
        textFile += `file 'temp${i}.mp4'` + `\n`;
        await writeVideoBufferToFile(sourceBufferObj.value, tempFilePath);
        tempFilePaths.push(tempFilePath);
    }
    var processedVideoBuffer = await mergeVideos(textFile);
    return processedVideoBuffer;
}

async function workSpaceItemsOverWSBG(mainVideoBuffer, overlayVideoBuffer, workSpaceItemsObj) {
    var processedVideoBuffer = await overlayVideo(mainVideoBuffer, overlayVideoBuffer, workSpaceItemsObj.x, workSpaceItemsObj.y, workSpaceItemsObj.width, workSpaceItemsObj.height, workSpaceItemsObj.enterStart, workSpaceItemsObj.exitEnd);
    return processedVideoBuffer;
}

async function processWorkSpaceBG(data) {
    var processedVideoBuffer = [];
    var workSpaceBG = await getWorkSpaceBGAsArrayOfObj(data.project.workspaceBG);
    for (const workSpaceBGObj of workSpaceBG) {
        var processedObj = { key: workSpaceBGObj.id };
        var sourceBuffer = await downloadSourceBufferFromURL('https://dash.animaker.com/a/u/' + workSpaceBGObj.src);
        sourceBuffer = await validateAndTrimVideoLength(sourceBuffer, workSpaceBGObj);
        sourceBuffer = await validateAndAdjustSoundSettings(sourceBuffer, workSpaceBGObj);
        sourceBuffer = await validateAndFlipVideo(sourceBuffer, workSpaceBGObj);
        sourceBuffer = await validateAndCropVideo(sourceBuffer, workSpaceBGObj, data.project.width, data.project.height);
        sourceBuffer = await validateScale(sourceBuffer, workSpaceBGObj, data.project.width, data.project.height);
        sourceBuffer = await validateFrameRate(sourceBuffer);
        processedObj.value = sourceBuffer;
        processedVideoBuffer.push(processedObj);
    }
    var processedBuffer = await mergeWorkSpaceBGVideos(processedVideoBuffer);
    return processedBuffer;
}

async function processWorkSpaceItems(workSpaceBuffer, data) {
    var workSpaceItems = await getWorkSpaceBGAsArrayOfObj(data.project.workspaceItems);
    for (const workSpaceItemsObj of workSpaceItems) {
        var sourceBuffer = await downloadSourceBufferFromURL('https://dash.animaker.com/a/u/' + workSpaceItemsObj.src);
        sourceBuffer = await validateAndTrimVideoLength(sourceBuffer, workSpaceItemsObj);
        sourceBuffer = await validateAndAdjustSoundSettings(sourceBuffer, workSpaceItemsObj);
        sourceBuffer = await validateAndFlipVideo(sourceBuffer, workSpaceItemsObj);
        workSpaceBuffer = await workSpaceItemsOverWSBG(workSpaceBuffer, sourceBuffer, workSpaceItemsObj);
        await writeVideoBufferToFile(workSpaceBuffer, 'Output_Video.mp4');
    }
    return workSpaceBuffer;
}

async function main() {
    console.log('START');
    var tempFilePath = './temp/';
    if (!fs.existsSync(tempFilePath))
        fs.mkdirSync(tempFilePath, { recursive: true });
    var data = await getInputData();
    var workSpaceBGBuffer = await processWorkSpaceBG(data);
    workSpaceBGBuffer = await processWorkSpaceItems(workSpaceBGBuffer, data);
    // await writeVideoBufferToFile(workSpaceBGBuffer, 'Output_Video.mp4');
    clearDirectory(tempFilePath);

    console.log('END');
    return;
}

main();
