import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@vercel/remix";
import { json, redirect } from "@vercel/remix";
import { Form, useLoaderData } from "@remix-run/react";
import { marked } from "marked";

import { deletePost, getPost, publishPost } from "~/models/post.server";
import { getUserId } from "~/session.server";
import { useOptionalUser } from "~/utils";


export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: "Post not found", }
    ]
  }

  return [
    {
      title: data.post.published ? data.post.title : `${data.post.title} (Draft)`,
    }
  ]
}


export async function action({ request, params }: ActionFunctionArgs) {
  const id = Number(params.id)
  const authorId = Number(await getUserId(request))

  switch (request.method) {
    case "PUT":
      await publishPost({ id, authorId })
      return redirect('/')
    case "DELETE":
      await deletePost({ id, authorId })
      return redirect('/');
    default:
      return null;
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id

  if (typeof id === 'undefined') {
    throw new Response("id not found", { status: 400 })
  }
  const post = await getPost({ id: Number(id) })

  if (!post) {
    throw new Response("Post not found", { status: 400 })
  }

  const postContenthtml = post.content ? marked(post.content) : ""

  const updatedPost = {
    ...post,
    content: postContenthtml
  }
  return json({ post: updatedPost })
}


export default function Post() {
  const { post } = useLoaderData<typeof loader>()
  const user = useOptionalUser()

  return (
    <div>
      <h2>{post.title}</h2>
      <p>By {post?.author?.name || 'Unknown author'}</p>
      <article dangerouslySetInnerHTML={{ __html: post.content }} />
      <div style={{ display: 'flex', }}>
        {user && <>
          {!post.published && (
            <Form method="put">
              <button type="submit" value="publish" name="_publish" className="button">
                Publish
              </button>
            </Form>
          )}
          <Form method="delete">
            <button type="submit" value="delete" name="_delete" className="button ml-10">
              Delete
            </button>
          </Form>

        </>}
      </div>
    </div>
  )
}