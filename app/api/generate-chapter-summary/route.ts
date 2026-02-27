import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { storyId, chapterNumber } = await request.json()

    // Get the chapter content
    const chapterResult = await sql`
      SELECT * FROM chapters 
      WHERE story_id = ${storyId} AND chapter_number = ${chapterNumber}
    `

    if (chapterResult.length === 0) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    const chapter = chapterResult[0]

    // Generate summary if it doesn't exist
    if (!chapter.summary) {
      const prompt = `Please provide a concise summary of this chapter in 2-3 sentences. Focus on the key plot points, character developments, and important events that will be relevant for future chapters.

Chapter Title: ${chapter.title}
Chapter Content: ${chapter.content}

Provide only the summary, no additional text.`

      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt,
        temperature: 0.3,
      })

      // Update chapter with summary
      await sql`
        UPDATE chapters 
        SET summary = ${text.trim()}, updated_at = NOW()
        WHERE id = ${chapter.id}
      `

      return NextResponse.json({ summary: text.trim() })
    }

    return NextResponse.json({ summary: chapter.summary })
  } catch (error) {
    console.error("Error generating chapter summary:", error)
    return NextResponse.json({ error: "Failed to generate chapter summary" }, { status: 500 })
  }
}
