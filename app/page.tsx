'use client'

import { init, tx, id } from '@instantdb/react'
import { useEffect, useState } from 'react'

import randomHandle from './utils/randomHandle'

// ID for app: instant-user-session
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

function App() {
  // Read Data
  const { isLoading, error, data } = db.useQuery({ messages: {} })
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
  const online = [user, ...Object.values(peers)].map((u) => u.handle).join(', ')

  const onKeyDown = (e: any) => {
    inputProps.onKeyDown(e);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addMessage(e.target.value, handle)
      e.target.value = ''
    }
  };

  return (
    <div className='p-4 space-y-6 w-full sm:w-[640px] mx-auto'>
      <h1 className='text-2xl font-bold'>Logged in as: {handle}</h1>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between  border-b-2 border-b-gray-500 pb-2 space-x-2">
          <div className="flex flex-1" >
            <input
              className="flex-1 px-2 py-1"
              autoFocus
              placeholder="Enter some message..."
              onKeyDown={onKeyDown}
              onBlur={inputProps.onBlur}
              type="text"
            />
          </div>
          <Button onClick={() => deleteAllMessages(messages)}>Delete All</Button>
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
      <div>Who's online: {online}</div>
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
