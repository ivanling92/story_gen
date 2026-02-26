import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { title, summary, genre, structure } = await request.json()

    if (!title || !summary || !genre || !structure) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert the story into the database
    const result = await sql`
      INSERT INTO stories (title, summary, genre, structure_type)
      VALUES (${title}, ${summary}, ${genre}, ${structure})
      RETURNING id
    `

    const storyId = result[0].id

    return NextResponse.json({ storyId })
  } catch (error) {
    console.error("Error creating story:", error)
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 })
  }
}
