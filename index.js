import 'babel-polyfill'
import vision from '@google-cloud/vision'
import fsExtra from 'fs-extra'
import https from 'https'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'

const client = new vision.ImageAnnotatorClient()

async function analyzeImage (path) {
  try {
    return await client.labelDetection(path)
  } catch (e) {
    console.log(e)
  }
}

async function downloadImage (url) {
  console.log(url)
  const fullpath = path.join(__dirname, '/images', _.last(url.split('/')))
  const exists = await fsExtra.pathExists(fullpath)
  if (exists) return fullpath
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(fullpath)
    https.get(url, res => {
      res.on('data', (data) => {
        file.write(data)
      })
      res.on('end', () => {
        file.end()
        resolve(fullpath)
      })
    })
  })
}

async function run () {
  try {
    const jsonStr = await fsExtra.readFile('./file.json')
    const feeds = JSON.parse(jsonStr.toString())
    for (let feed of feeds) {
      const fullpath = await downloadImage(feed.image)
      feed.googleVision = await analyzeImage(fullpath)
    }
    return await fsExtra.writeFile('result.json', JSON.stringify(feeds))
  } catch (e) {
    throw e
  }
}

run()
