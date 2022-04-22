
const http = require('http')
const path = require('path')
// const express = require('express')
const socketIo = require('socket.io')
const express = require('express')
const needle = require('needle')
const config = require('dotenv').config()
const TOKEN = process.env.TWITTER_BEARER_TOKEN
const PORT = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketIo(server)


app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'index.html'))
    // res.sendFile(path.resolve(__dirname, '../', 'client', 'style.css'))
})


const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'

const streamURL =
'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id'
    // 'http://api.twitter.com/2/tweets/search/stream'

const rules = [{ value: 'coding' }]



async function getRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })
    console.log(response.body)
    return response.body
}


async function setRules() {
    const data = {
        add: rules
    }
    const response = await needle('post', rulesURL,data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`
        }
    })

    // console.log(response.body)
    return response.body
}

async function deleteRules(rules) {
    if (!Array.isArray(rules.data)) {
        return null

    }
    const ids = rules.data.map((rule) => rule.id)
    const data = {
        delete: {
            ids: ids
        },
    }
    const response = await needle('post', rulesURL,data,{
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`
        }
    })
    // console.log(response.body)
    return response.body
}

function streamTweets(socket) {
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })
    stream.on('data', (data) => {
        try {
            const json = JSON.parse(data)
            console.log(json)
            socket.emit('tweet', json)
        } catch (error) { }
    })
}
io.on('connection', async () => {
    console.log('Client connected..')
    let currentRules
    try {

        currentRules = await getRules()
        await deleteRules(currentRules)
        await setRules()
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
    streamTweets(io)
//     const filteredStream = streamTweets(io)

//   let timeout = 0
//   filteredStream.on('timeout', () => {
//     // Reconnect on error
//     console.warn('A connection error occurred. Reconnecting…')
//     setTimeout(() => {
//       timeout++
//       streamTweets(io)
//     }, 2 ** timeout)
//     streamTweets(io)
//   })
// })
//  ;(async()=>{
//     
//  })()
})

server.listen(PORT, () => console.log(`listening on ${PORT}`))