import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { neon } from "@neondatabase/serverless"
import { getStoryBeatForChapter, STORY_STRUCTURES } from "@/lib/story-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { storyId, chapterNumber } = await request.json()

    if (!storyId || !chapterNumber) {
      return NextResponse.json({ error: "Story ID and chapter number are required" }, { status: 400 })
    }

    // Get story details
    const storyResult = await sql`
      SELECT * FROM stories WHERE id = ${storyId}
    `

    if (storyResult.length === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    const story = storyResult[0]

    // Get story structure information
    const structureResult = await sql`
      SELECT * FROM story_structures WHERE name = ${story.structure_type}
    `

    const structure = structureResult[0]

    // Check if chapter already exists
    const existingChapter = await sql`
      SELECT * FROM chapters 
      WHERE story_id = ${storyId} AND chapter_number = ${chapterNumber}
    `

    if (existingChapter.length > 0) {
      // Chapter already exists, return it
      return NextResponse.json({ chapter: existingChapter[0] })
    }

    // Get previous chapters for context
    const previousChapters = await sql`
      SELECT chapter_number, title, summary, content
      FROM chapters 
      WHERE story_id = ${storyId} AND chapter_number < ${chapterNumber}
      ORDER BY chapter_number ASC
    `

    // Generate chapter content
    const chapterContent = await generateChapterContent(story, chapterNumber, previousChapters)

    // Calculate word count
    const wordCount = chapterContent.content.split(/\s+/).length

    // Insert chapter into database
    const insertResult = await sql`
      INSERT INTO chapters (story_id, chapter_number, title, content, summary, word_count, status)
      VALUES (${storyId}, ${chapterNumber}, ${chapterContent.title}, ${chapterContent.content}, ${chapterContent.summary}, ${wordCount}, 'generated')
      RETURNING *
    `

    const chapter = insertResult[0]

    // Start background generation of next chapter if not the last chapter
    if (chapterNumber < story.total_chapters) {
      // Fire and forget - generate next chapter in background
      generateNextChapterInBackground(storyId, chapterNumber + 1)
    }

    return NextResponse.json({ chapter })
  } catch (error) {
    console.error("Error generating chapter:", error)
    return NextResponse.json({ error: "Failed to generate chapter" }, { status: 500 })
  }
}

async function generateChapterContent(story: any, chapterNumber: number, previousChapters: any[]) {
  const isFirstChapter = chapterNumber === 1
  const isLastChapter = chapterNumber === story.total_chapters

  const structure = STORY_STRUCTURES[story.structure_type]
  const currentBeat = getStoryBeatForChapter(chapterNumber, story.total_chapters, story.structure_type)

  // Get beat-specific guidance
  const beatGuidance = getBeatGuidance(currentBeat, story.structure_type, chapterNumber, story.total_chapters)

  let contextPrompt = ""
  if (previousChapters.length > 0) {
    const recentChapters = previousChapters.slice(-2) // Use last 2 chapters for context
    contextPrompt = `
Previous chapters context:
${recentChapters.map((ch) => `Chapter ${ch.chapter_number}: ${ch.title}\nSummary: ${ch.summary}`).join("\n\n")}
`
  }

  const prompt = `You are writing Chapter ${chapterNumber} of an 8-chapter ${story.genre} story titled "${story.title}".

Story Summary: ${story.summary}
Story Structure: ${structure?.name || story.structure_type}
Current Story Beat: ${currentBeat}
Beat Guidance: ${beatGuidance}

${contextPrompt}

Chapter Requirements:
- This is ${isFirstChapter ? "the opening chapter" : isLastChapter ? "the final chapter" : `chapter ${chapterNumber} of 8`}
- Target length: 3000+ words
- Genre: ${story.genre}
- Follow the "${currentBeat}" beat requirements precisely
- ${isFirstChapter ? "Establish the world, characters, and initial conflict" : ""}
- ${isLastChapter ? "Provide a satisfying conclusion that resolves the main conflict" : "End with a compelling hook for the next chapter"}
- Write in third person narrative
- Include dialogue, action, and descriptive passages
- Maintain consistency with previous chapters
- Ensure the chapter serves the story structure's pacing and development

IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON.

Generate a JSON object with exactly these fields:
- title: A compelling chapter title (2-6 words)
- content: The full chapter content (3000+ words) - properly escape all quotes and newlines
- summary: A brief chapter summary (2-3 sentences)

Example format:
{"title": "Chapter Title", "content": "Full chapter content with properly escaped quotes and newlines...", "summary": "Brief summary..."}

Write engaging, immersive prose that draws the reader in and serves the story structure effectively.`

  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt,
    temperature: 0.7,
  })

  try {
    console.log("[v0] Raw AI response length:", text.length)

    // Try to parse the response as JSON
    let parsedResponse
    try {
      parsedResponse = JSON.parse(text)
    } catch (initialParseError) {
      console.log("[v0] Initial JSON parse failed, attempting to fix malformed JSON")

      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0])
        } catch (secondParseError) {
          console.log("[v0] Second parse attempt failed, trying manual extraction")

          // Manual extraction as fallback
          const titleMatch = text.match(/"title":\s*"([^"]*)"/)
          const summaryMatch = text.match(/"summary":\s*"([^"]*)"/)

          // Extract content between "content": and the next field or end
          let contentMatch = text.match(/"content":\s*"([\s\S]*?)"\s*,\s*"summary"/)
          if (!contentMatch) {
            contentMatch = text.match(/"content":\s*([\s\S]*?)\s*,\s*"summary"/)
            if (contentMatch) {
              // Remove quotes and clean up the content
              let content = contentMatch[1].trim()
              if (content.startsWith('"') && content.endsWith('"')) {
                content = content.slice(1, -1)
              }
              // Handle the case where content is not quoted
              if (!content.startsWith('"')) {
                // Find the actual content between the colon and comma
                const rawContentMatch = text.match(/"content":\s*\n\n([\s\S]*?)\n\n\s*,\s*"summary"/)
                if (rawContentMatch) {
                  content = rawContentMatch[1].trim()
                }
              }
              contentMatch[1] = content
            }
          }

          if (titleMatch && contentMatch && summaryMatch) {
            parsedResponse = {
              title: titleMatch[1],
              content: contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"),
              summary: summaryMatch[1],
            }
          } else {
            throw new Error("Could not extract required fields from AI response")
          }
        }
      } else {
        throw new Error("No JSON structure found in AI response")
      }
    }

    // Validate the response has required fields
    if (!parsedResponse.title || !parsedResponse.content || !parsedResponse.summary) {
      throw new Error("AI response missing required fields")
    }

    console.log("[v0] Successfully parsed chapter content")
    return parsedResponse
  } catch (parseError) {
    console.error("Failed to parse chapter content:", text.substring(0, 500) + "...")
    console.error("Parse error:", parseError)
    throw new Error("Failed to generate valid chapter content")
  }
}

function getBeatGuidance(beat: string, structureType: string, chapterNumber: number, totalChapters: number): string {
  const beatGuidance: Record<string, string> = {
    // Freytag's Pyramid
    exposition:
      "Introduce the main character, setting, and background. Establish the normal world before conflict arises.",
    rising_action:
      "Build tension and develop the conflict. Introduce obstacles and complications that challenge the protagonist.",
    climax: "The turning point of the story. The main conflict reaches its peak intensity.",
    falling_action: "Show the consequences of the climax. Begin resolving subplots and complications.",
    resolution: "Conclude the story. Resolve remaining conflicts and show the new normal.",

    // Hero's Journey
    ordinary_world: "Show the hero in their familiar environment before the adventure begins.",
    call_to_adventure: "Present the problem or challenge that starts the hero's journey.",
    refusal: "The hero hesitates or refuses the call, showing the stakes and fear.",
    mentor: "Introduce a wise figure who gives advice, magical items, or training.",
    crossing_threshold: "The hero commits to the adventure and enters a new world.",
    tests: "The hero faces challenges and makes allies and enemies in the new world.",
    ordeal: "The hero faces their greatest fear or most difficult challenge.",
    reward: "The hero survives and gains something from the experience.",
    road_back: "The hero begins the journey back to the ordinary world.",
    resurrection: "A final test where the hero must use everything they've learned.",
    return: "The hero returns home transformed and able to help others.",

    // Three Act Structure
    setup: "Establish characters, setting, and the inciting incident that starts the main conflict.",
    confrontation: "Develop the main conflict through escalating challenges and obstacles.",

    // Default guidance
    development: "Continue developing the plot and characters while maintaining story momentum.",
  }

  return beatGuidance[beat] || beatGuidance.development
}

async function generateNextChapterInBackground(storyId: number, nextChapterNumber: number) {
  try {
    // Check if next chapter already exists
    const existingChapter = await sql`
      SELECT id FROM chapters 
      WHERE story_id = ${storyId} AND chapter_number = ${nextChapterNumber}
    `

    if (existingChapter.length === 0) {
      // Generate next chapter in background
      console.log(`[v0] Starting background generation of chapter ${nextChapterNumber} for story ${storyId}`)

      // Make internal API call to generate the chapter
      const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/generate-chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          chapterNumber: nextChapterNumber,
        }),
      })

      if (response.ok) {
        console.log(`[v0] Successfully generated chapter ${nextChapterNumber} in background`)
      } else {
        console.error(`[v0] Failed to generate chapter ${nextChapterNumber} in background`)
      }
    }
  } catch (error) {
    console.error(`[v0] Error in background chapter generation:`, error)
  }
}
