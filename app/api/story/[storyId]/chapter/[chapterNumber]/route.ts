import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { storyId: string; chapterNumber: string } }) {
  try {
    const { storyId, chapterNumber } = params

    // Check if chapter exists
    let chapterResult = await sql`
      SELECT * FROM chapters 
      WHERE story_id = ${storyId} AND chapter_number = ${chapterNumber}
    `

    if (chapterResult.length === 0) {
      // Generate chapter if it doesn't exist
      const response = await fetch(`${request.nextUrl.origin}/api/generate-chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          chapterNumber: Number.parseInt(chapterNumber),
        }),
      })

      if (response.ok) {
        const { chapter } = await response.json()
        chapterResult = [chapter]
      } else {
        return NextResponse.json({ error: "Failed to generate chapter" }, { status: 500 })
      }
    }

    // Update story's current chapter
    await sql`
      UPDATE stories 
      SET current_chapter = ${chapterNumber}, updated_at = NOW()
      WHERE id = ${storyId}
    `

    return NextResponse.json({
      chapter: chapterResult[0],
    })
  } catch (error) {
    console.error("Error fetching chapter:", error)
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 })
  }
}
