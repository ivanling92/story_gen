import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { storyId: string } }) {
  try {
    const storyId = params.storyId

    // Get story details
    const storyResult = await sql`
      SELECT * FROM stories WHERE id = ${storyId}
    `

    if (storyResult.length === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    const story = storyResult[0]

    // Get current chapter or generate first chapter if none exists
    let chapterResult = await sql`
      SELECT * FROM chapters 
      WHERE story_id = ${storyId} AND chapter_number = ${story.current_chapter}
    `

    if (chapterResult.length === 0) {
      // Generate first chapter if it doesn't exist
      const response = await fetch(`${request.nextUrl.origin}/api/generate-chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          chapterNumber: 1,
        }),
      })

      if (response.ok) {
        const { chapter } = await response.json()
        chapterResult = [chapter]
      } else {
        return NextResponse.json({ error: "Failed to generate first chapter" }, { status: 500 })
      }
    }

    return NextResponse.json({
      story,
      chapter: chapterResult[0],
    })
  } catch (error) {
    console.error("Error fetching story:", error)
    return NextResponse.json({ error: "Failed to fetch story" }, { status: 500 })
  }
}
