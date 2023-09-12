import { json, type LoaderArgs, type V2_MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react";
import Login from "components/login";

import createServerSupabase from "utils/supabase.server"

// eslint-disable-next-line no-empty-pattern
export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response()
  const supabase = createServerSupabase({ request, response })

  const { data } = await supabase
    .from('messages')
    .select()
  return json({ messages: data ?? [] }, {    headers: response.headers  })
}


export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { messages } = useLoaderData<typeof loader>()

  return (
    <>
      <Login />
      <pre> {JSON.stringify(messages, null, 2)}</pre >
    </>
  )
}
