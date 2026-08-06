/**
 * Region reference notes.
 *
 * These are deliberately hedged descriptions of *tendencies observed in some
 * settings*, never claims about people. They exist to prompt better context,
 * not to predict an individual's meaning.
 */
export interface RegionNote {
  name: string;
  aliases: string[];
  note: string;
}

export const REGION_NOTES: RegionNote[] = [
  {
    name: "Japan",
    aliases: ["japan", "japanese", "tokyo", "osaka"],
    note: "In some workplace and school settings, agreement is signalled indirectly and refusals may be softened or implied. Age, rank and institutional rules often shape wording more than personal feeling does. Individuals vary widely, and many settings are highly direct.",
  },
  {
    name: "United States",
    aliases: ["united states", "usa", "us", "america", "american"],
    note: "In many professional settings, positive framing and explicit verbal agreement are common, which can make polite enthusiasm hard to distinguish from firm commitment. Regional, organisational and personal differences are large.",
  },
  {
    name: "United Kingdom",
    aliases: ["united kingdom", "uk", "britain", "british", "england"],
    note: "In some contexts understatement and qualified phrasing ('a slight problem', 'not quite') carry more weight than their literal wording suggests. This varies strongly by region, sector and individual.",
  },
  {
    name: "Germany",
    aliases: ["germany", "german", "berlin"],
    note: "In several professional settings, task-focused directness is treated as respectful rather than harsh, and critical feedback may be separated from personal regard. This is a tendency in some contexts, not a rule.",
  },
  {
    name: "France",
    aliases: ["france", "french", "paris"],
    note: "In some professional and academic settings, debate and explicit disagreement can be part of ordinary discussion rather than a sign of conflict. Formality of address may still be carefully maintained.",
  },
  {
    name: "China",
    aliases: ["china", "chinese", "beijing", "shanghai"],
    note: "In some settings, relationship and seniority influence how directly a concern is raised, and 'not convenient' can function as a considerate refusal. Practices differ greatly by sector, city and generation.",
  },
  {
    name: "Korea",
    aliases: ["korea", "korean", "south korea", "seoul"],
    note: "In some organisational and academic settings, seniority is grammatically and socially marked, and disagreement may be raised privately rather than in a group. Individual and generational variation is substantial.",
  },
  {
    name: "India",
    aliases: ["india", "indian", "delhi", "mumbai", "bangalore"],
    note: "In some settings, agreement may be expressed to preserve harmony while practical concerns are raised later or through a third person. India is highly diverse linguistically and regionally, so generalisation is weak.",
  },
  {
    name: "Netherlands",
    aliases: ["netherlands", "dutch", "holland", "amsterdam"],
    note: "In many settings, explicit and blunt phrasing is intended as efficient and egalitarian rather than confrontational. Reception of that style varies by person.",
  },
  {
    name: "Brazil",
    aliases: ["brazil", "brazilian", "sao paulo", "rio"],
    note: "In some settings, warmth and personal rapport are built before business content, and a soft 'we'll see' may serve as a considerate deferral. Practices vary by region and organisation.",
  },
  {
    name: "Mexico",
    aliases: ["mexico", "mexican"],
    note: "In some settings, politeness formulas and indirect refusals help preserve the relationship, and hierarchy may shape who speaks first. Individual variation is large.",
  },
  {
    name: "Nigeria",
    aliases: ["nigeria", "nigerian", "lagos"],
    note: "In some settings, respect for age and position is explicitly marked in address, and disagreement may be raised through intermediaries. Nigeria is multilingual and highly varied.",
  },
  {
    name: "Middle East / Gulf",
    aliases: ["middle east", "gulf", "uae", "saudi", "qatar", "dubai"],
    note: "In some settings, hospitality and relationship-building precede business, and a polite agreement may indicate goodwill rather than final commitment. National, sectoral and individual differences are significant.",
  },
  {
    name: "Nordic countries",
    aliases: ["nordic", "sweden", "norway", "denmark", "finland", "swedish", "finnish", "danish", "norwegian"],
    note: "In some workplace settings, consensus-seeking is combined with restrained expression, so silence may indicate consideration rather than disapproval. Individuals differ considerably.",
  },
  {
    name: "Australia",
    aliases: ["australia", "australian", "sydney", "melbourne"],
    note: "In some settings, informality and understatement coexist, and humour may be used to soften a serious point. Reading intention from tone alone remains unreliable.",
  },
];

export function searchRegions(query: string): RegionNote[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return REGION_NOTES.filter(
    (r) => r.name.toLowerCase().includes(q) || r.aliases.some((a) => a.includes(q) || q.includes(a)),
  ).slice(0, 6);
}
