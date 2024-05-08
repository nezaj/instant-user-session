'use client'

import { init, tx, id } from '@instantdb/react'

import randomHandle from './utils/randomHandle'
import { useState, useRef, useEffect } from 'react'

// ---------
// Helpers
// ---------
function Button({ children, onClick }) {
  return (
    <button
      className="px-2 py-1 outline hover:bg-gray-200"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

const handle = randomHandle()

// ---------
// App
// ---------

// Replace this with your own App ID from https://instantdb.com/dash
const APP_ID = '11920699-e06d-4d77-87a3-0767b7cfa604'

type Message = {
  id: string
  text: string
  handle: string
  createdAt: number
}

type Schema = {
  messages: Message
}

type RoomSchema = {
  messages: {
    presence: { handle: string }
  }
}


const db = init<Schema, RoomSchema>({ appId: APP_ID })
const room = db.room('messages', 'main')

function App() {
  // Read Data
  const { isLoading, error, data } = db.useQuery({ messages: {} })
  const inputRef = useRef(null)
  const [editId, setEditId] = useState(null)
  const { user, peers, publishPresence } = room.usePresence()
  const { active, inputProps } = room.useTypingIndicator('messageBar')

  useEffect(() => {
    publishPresence({ handle })
  })

  if (isLoading) {
    return <div>Fetching data...</div>
  }
  if (error) {
    return <div>Error fetching data: {error.message}</div>
  }
  const { messages } = data

  const onSubmit = () => {
    addMessage(inputRef.current.value, handle)
    inputRef.current.value = ''
    inputRef.current.focus()
  }
  const onKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  };
  const online = [user, ...Object.values(peers)].map((u) => u.handle).join(', ')

  return (
    <div className='p-4 space-y-6 w-full sm:w-[640px] mx-auto'>
      <h1 className='text-2xl font-bold'>Logged in as: {handle}</h1>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between border-b border-b-gray-500 pb-2 space-x-2">
          <div className="flex flex-1" >
            <input
              ref={inputRef}
              className="flex-1 py-1 px-2"
              autoFocus
              placeholder="Enter some message..."
              onKeyDown={onKeyDown}
              type="text"
            />
          </div>
          <Button onClick={onSubmit}>Submit</Button>

        </div>
        <div className="truncate text-xs text-gray-500">
          {active.length ? typingInfo(active) : <>&nbsp;</>}
        </div>
      </div>

      <div className="space-y-2">
        {messages.map((message) => (
          <div key={message.id}>
            {editId === message.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  db.transact(
                    tx.message[message.id].update({
                      text: e.target[0].value,
                    })
                  )
                  setEditId(null)
                }}
              >
                <input
                  defaultValue={message.text}
                  autoFocus
                  type="text"
                />
              </form>
            ) : (
              <div className="flex justify-between">
                <p>{message.handle}: {message.text}</p>
                <span className="space-x-4">
                  <Button onClick={() => setEditId(message.id)}>Edit</Button>
                  <Button onClick={() => deleteMessage(message)}>Delete</Button>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-b border-b-gray-300 pb-2">Who's online: {online}</div>
      <Button onClick={() => deleteAllMessages(messages)}>Delete All</Button>
    </div>
  )
}

// Ephemeral
function typingInfo(typing: { handle: string }[]) {
  if (typing.length === 0) return null;
  if (typing.length === 1) return `${typing[0].handle} is typing...`;
  if (typing.length === 2)
    return `${typing[0].handle} and ${typing[1].handle} are typing...`;

  return `${typing[0].handle} and ${typing.length - 1} others are typing...`;
}

// Write Data
// ---------
function addMessage(text: string, handle: string) {
  db.transact(
    tx.messages[id()].update({
      text,
      handle,
      createdAt: Date.now(),
    })
  )
}

function deleteMessage(message: Message) {
  db.transact(tx.message[message.id].delete())
}

function deleteAllMessages(messages: Message[]) {
  const txs = messages.map((message) => tx.message[message.id].delete())
  db.transact(txs)
}

export default App
