// Utility functions for story and chapter management

export interface StoryStructure {
  name: string
  description: string
  beats: string[]
  chapter_mapping: number[]
}

export const STORY_STRUCTURES: Record<string, StoryStructure> = {
  freytag: {
    name: "Freytag's Pyramid",
    description: "Classic dramatic structure with exposition, rising action, climax, falling action, and resolution",
    beats: ["exposition", "rising_action", "climax", "falling_action", "resolution"],
    chapter_mapping: [1, 3, 4, 6, 8],
  },
  hero_journey: {
    name: "The Hero's Journey",
    description: "Joseph Campbell's monomyth structure following the hero's transformative adventure",
    beats: [
      "ordinary_world",
      "call_to_adventure",
      "refusal",
      "mentor",
      "crossing_threshold",
      "tests",
      "ordeal",
      "reward",
      "road_back",
      "resurrection",
      "return",
    ],
    chapter_mapping: [1, 1, 2, 2, 3, 4, 5, 6, 7, 7, 8],
  },
  three_act: {
    name: "Three Act Structure",
    description: "Simple three-part structure with setup, confrontation, and resolution",
    beats: ["setup", "confrontation", "resolution"],
    chapter_mapping: [2, 5, 1],
  },
  dan_harmon: {
    name: "Dan Harmon's Story Circle",
    description: "Simplified hero's journey focusing on character transformation",
    beats: ["you", "need", "go", "search", "find", "take", "return", "change"],
    chapter_mapping: [1, 1, 2, 3, 4, 5, 6, 8],
  },
  fichtean: {
    name: "Fichtean Curve",
    description: "Rising action structure with multiple crisis points leading to climax",
    beats: ["inciting_incident", "crisis_1", "crisis_2", "crisis_3", "climax", "falling_action"],
    chapter_mapping: [1, 2, 4, 6, 7, 8],
  },
  save_cat: {
    name: "Save the Cat Beat Sheet",
    description: "Detailed 15-beat structure popular in screenwriting",
    beats: [
      "opening_image",
      "setup",
      "catalyst",
      "debate",
      "break_into_two",
      "b_story",
      "fun_games",
      "midpoint",
      "bad_guys_close_in",
      "all_is_lost",
      "dark_night",
      "break_into_three",
      "finale",
      "final_image",
    ],
    chapter_mapping: [1, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8, 8],
  },
  seven_point: {
    name: "Seven-Point Story Structure",
    description: "Structure focusing on key plot points and character development",
    beats: ["hook", "plot_turn_1", "pinch_point_1", "midpoint", "pinch_point_2", "plot_turn_2", "resolution"],
    chapter_mapping: [1, 2, 3, 4, 5, 6, 8],
  },
}

export function getStoryBeatForChapter(chapterNumber: number, totalChapters: number, structureType: string): string {
  const structure = STORY_STRUCTURES[structureType]
  if (!structure) return "development"

  const { beats, chapter_mapping } = structure

  if (chapter_mapping && Array.isArray(chapter_mapping)) {
    // For structures with explicit chapter mapping
    let cumulativeChapters = 0
    for (let i = 0; i < chapter_mapping.length; i++) {
      cumulativeChapters += chapter_mapping[i]
      if (chapterNumber <= cumulativeChapters) {
        return beats[i] || beats[0]
      }
    }
    return beats[beats.length - 1]
  }

  // Fallback: distribute beats evenly across chapters
  const beatIndex = Math.floor(((chapterNumber - 1) / totalChapters) * beats.length)
  return beats[Math.min(beatIndex, beats.length - 1)]
}

export function getChapterProgress(chapterNumber: number, totalChapters: number): number {
  return Math.round((chapterNumber / totalChapters) * 100)
}

export function estimateReadingTime(wordCount: number, wordsPerMinute = 200): number {
  return Math.ceil(wordCount / wordsPerMinute)
}

export function getStructureDescription(structureType: string): string {
  const structure = STORY_STRUCTURES[structureType]
  return structure?.description || "Custom story structure"
}

export function getAllBeatsForStructure(structureType: string): string[] {
  const structure = STORY_STRUCTURES[structureType]
  return structure?.beats || []
}

export function getChapterBeatInfo(chapterNumber: number, totalChapters: number, structureType: string) {
  const currentBeat = getStoryBeatForChapter(chapterNumber, totalChapters, structureType)
  const allBeats = getAllBeatsForStructure(structureType)
  const beatIndex = allBeats.indexOf(currentBeat)
  const beatProgress = beatIndex >= 0 ? ((beatIndex + 1) / allBeats.length) * 100 : 0

  return {
    currentBeat,
    beatIndex,
    beatProgress,
    totalBeats: allBeats.length,
    structureDescription: getStructureDescription(structureType),
  }
}
