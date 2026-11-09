export interface LabStep {
  id: string;
  instruction: string;
  hint: string;
  isCompleted: boolean;
}

export interface LabChallenge {
  id: string;
  category: 'reseau' | 'telecom';
  title: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  summary: string;
  context: string;
  objectives: string[];
  steps: LabStep[];
  theoryNotes: string[];
}
