// site/src/types.ts
export type HarnessFlavor = 'standard' | 'post' | 'jsx' | 'webgpu'
export type WiringKind = 'object3d' | 'material' | 'camera' | 'pass' | 'value'

export interface PlaySeed {
  moduleId:       string
  exportName:     string
  flavor:         HarnessFlavor
  kind:           WiringKind
  code:           string
  requiresWebGpu: boolean
}

export interface LibraryExport {
  name:          string
  kind:          string
  doc:           string
  summary:       string
  signature:     string
  coverage:      'playground' | 'type-reference'
  sample:        string
  relatedDemos:  string[]
  category:      string
  categoryLabel: string
  playSeed?:     PlaySeed
}

export interface LibraryCategory {
  id:    string
  label: string
  count: number
}

export interface LibraryModule {
  id:         string
  subpath:    string
  specifier:  string
  title:      string
  desc:       string
  entry:      string
  importUrl:  string
  example?:   string
  categories: LibraryCategory[]
  exports:    LibraryExport[]
}

export interface LibraryData {
  version:     string
  packageName: string
  generatedAt: string
  totals: {
    exports: number
    modules: number
    playable: number
    typeReferences: number
  }
  modules: LibraryModule[]
}

export interface DemoInfo {
  slug:    string
  label:   string
  caption: string
}

export interface DemoData {
  demos: DemoInfo[]
}

export interface SkillReference {
  file:    string
  title:   string
  summary: string
}

export interface SkillScript {
  file:      string
  category:  string
  purpose:   string
  reference: string
  exists:    boolean
}

export interface SkillCase {
  id:        string
  title:     string
  summary:   string
  demoMode:  'live' | 'schema' | 'guide'
  tags:      string[]
  demos:     string[]
  refs:      string[]
  scripts:   string[]
  checklist: string[]
}

export interface SkillData {
  version:    string
  generatedAt: string
  skill: {
    name:        string
    description: string
  }
  references: SkillReference[]
  scripts:    SkillScript[]
  cases:      SkillCase[]
  coverage: {
    references: { total: number, covered: number }
    scripts:    { total: number, covered: number }
  }
}
