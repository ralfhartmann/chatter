import { useOutletContext } from "@remix-run/react"
import type { Database } from "db_types"
import { useEffect, useState } from "react"

import type { SupabaseOutletContext } from "~/root"

type Message = Database["public"]["Tables"]["messages"]["Row"]

const Message = ({ message }: { message: Message }) => {
    const { supabase } = useOutletContext<SupabaseOutletContext>()

    const [content, setContent] = useState(message.content)
    return (
        <div>
            <input
                type="text"
                value={content}
                onChange={event => setContent(event.target.value)} />
            <button
                disabled={content === message.content}
                onClick={() => {
                    console.log(`change ${message.id}`)
                    supabase
                        .from("messages")
                        .update({ content: String(content) })
                        .eq('id', String(message.id))
                        .then(() => {
                            console.log(`message ${message.content} updated to ${content}`)
                        }, console.error)
                }}
            >Send</button>
            <button
                onClick={async () => {
                    console.log(`delete ${message?.id}`)
                    supabase
                        .from("messages")
                        .delete()
                        .match({ id: message.id })
                        .then(() => {
                            console.log(`message ${message.content} deleted`)
                        })
                }}
            >X</button>
        </div>
    )
}

const RealTimeMessages = ({
    serverMessages,
}: {
    serverMessages: Message[]
}) => {
    const { supabase } = useOutletContext<SupabaseOutletContext>()

    const [messages, setMessages] = useState(serverMessages)

    useEffect(() => {
        const channel = supabase
            .channel("schema-db-changes")
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "messages"
            }, payload => {
                console.log(payload)
                const newMessage = payload.new as Message
                switch (payload.eventType) {
                    case "INSERT":
                        setMessages(messages => [...messages, newMessage])
                        break
                    case "DELETE":
                        setMessages(messages => messages.filter(message => message.id !== payload.old.id))
                        break
                    case "UPDATE":
                        setMessages(messages => messages.map(message => message.id === payload.old.id ? newMessage : message))
                        break
                }
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    useEffect(() => {
        setMessages(serverMessages)
    }, [serverMessages])

    return (
        <div>
            {messages?.map(message => <Message
                key={message.id}
                message={message} />
            )}
        </div>
    )
}
export default RealTimeMessages
