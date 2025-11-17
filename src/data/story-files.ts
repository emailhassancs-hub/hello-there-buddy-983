export const fileContents: Record<string, string> = {
  abstract: `THE TEMPLE DIAMOND HEIST - Story Abstract

In the mystical Temple of Eternal Light, the sacred Diamond of Aeons is stolen by a villainous syndicate. Mia Shiranui, temple guardian and sister to renowned fighter Chun-Li, is kidnapped during the attack. When Chun-Li returns to find destruction and her sister missing, she vows to track down those responsible. Her journey takes her through confrontations with mercenary Madara and ultimately to the fortress of Magma, the syndicate's leader, where she must fight to rescue her sister and recover the stolen diamond.

The story features branching paths based on player performance in key battles, leading to different challenges but ultimately converging toward the final rescue mission.`,

  scene1: `SCENE 1: TEMPLE OF ETERNAL LIGHT

Setting: Deep within misty mountains lies the Temple of Eternal Light, where the Diamond of Aeons rests.

Story: Mia Shiranui, sworn guardian, kneels in meditation before the altar. Her flame dances with the sacred gem's glow. Suddenly, darkness falls. Thunder cracks. A shadow approaches—the villain, cloaked in power drawn from darkness.

Mia rises to defend. Magma, a fiery warrior, bursts in to aid her.

Type: Cutscene
Duration: ~2 minutes
Next: Scene 2 (Villain Attacks)`,

  scene2: `SCENE 2: THE ASSAULT

Gameplay Moment: Magma fights the villain in a tutorial combat sequence.

Despite her fiery attacks, the villain overwhelms her. The temple trembles. In a flash of light—the diamond is stolen. Mia is captured and vanishes into the void. Magma collapses, flames fading to embers.

Type: Gameplay Tutorial
Playable Character: Magma (tutorial)
Outcome: Scripted loss
Next: Scene 3 (Chun-Li Returns)`,

  scene3: `SCENE 3: CHUN-LI'S RETURN

Cutscene Video: Video_of_Model_Performing_Leg_Kicks

Story: Chun-Li, returning from a distant mission, enters the temple to find sacred grounds desecrated—walls cracked, altar shattered, diamond missing.

She kneels beside ruins, clutching a fragment of Mia's ribbon.

"Mia... who did this to you?"

She finds torn armor belonging to Madara, a mercenary under Magma's syndicate. Determined and furious, Chun-Li vows to uncover the truth.

Type: Cutscene
Character: Chun-Li
Next: Scene 4 (Madara Confrontation)`,

  scene4: `SCENE 4: CONFRONTATION WITH MADARA

Cutscene Video: Character_Fighting_Moves_Video_Generation

Story: Chun-Li arrives in an underground coliseum, flames flickering from torches.

Madara: "Looking for your sister? You're too late."
Chun-Li: "Then I'll beat the truth out of you!"

Type: Cutscene/Pre-Battle
Characters: Chun-Li, Madara
Next: Scene 5 (Battle)`,

  scene5: `SCENE 5: BATTLE - CHUN-LI VS MADARA

Gameplay: Anime_Face_Off_Challenge_Accepted

Epic combat encounter. Player controls Chun-Li against Madara in the underground coliseum.

Victory Condition: Reduce Madara's health to 0
Defeat Condition: Chun-Li's health reaches 0

Type: Gameplay Battle
Difficulty: Medium
Branching Point: Yes
- Victory → Outcome B (Scene 6B)
- Defeat → Outcome A (Scene 6A)`,

  scene6: `SCENE 6: JOURNEY THROUGH THE SHADOWS

Story: The path ahead is filled with danger. Chun-Li travels through ruins of fallen temples and dense jungles—ambushed by smaller villains and mercenaries working for Magma.

Gameplay: Series of battles and exploration sequences. Each victory brings her closer to the truth—and to Mia.

At last, she reaches the blazing gates of Magma's Fortress.

Type: Gameplay Sequence
Encounters: 5-7 enemy waves
Next: Scene 7 (Magma Encounter)`,

  scene7: `SCENE 7: THE ENCOUNTER WITH MAGMA

Cutscene: Magma introduction video

Story: The ground cracks beneath Chun-Li's feet as Magma descends, body radiating heat and fury.

Magma: "You shouldn't have come here, warrior."
Chun-Li: "You took my sister. Now, I'm taking her back."

Gameplay: Epic boss battle—Chun-Li vs Magma. Kicks and flames clash like lightning and thunder.

Type: Boss Battle
Difficulty: Hard
Next: Scene 8 (Rescue)`,

  scene8: `SCENE 8: THE RESCUE

Cutscene Video: Chun_Li_and_Mai_Fight_Enemies.mp4

Story: After grueling battle, Magma collapses. Chun-Li rushes deeper into fortress—finding Mia chained within a chamber of molten light.

Mia: "You came for me..."
Chun-Li: "Always."

They embrace briefly—then alarms blare. Enemies swarm.

Gameplay: Chun-Li and Mia fight side by side. Combined strength shatters Magma's forces. Temple collapses as they escape into dawn, victorious but wary—the Diamond of Aeons still lies missing.

Type: Cutscene + Gameplay
Playable: Both Chun-Li and Mia
Ending: "To Be Continued..."`,

  chunli: `{
  "name": "Chun-Li",
  "role": "Protagonist",
  "description": "Skilled martial artist known for her powerful kicks and unwavering determination. On a mission to rescue her sister Mia.",
  "abilities": ["Lightning Kick", "Spinning Bird Kick", "Kikoken"],
  "image": "chichi_martial_arts_qwen.png",
  "stats": {
    "strength": 85,
    "speed": 90,
    "defense": 75
  }
}`,

  madara: `{
  "name": "Madara",
  "role": "Mid-Boss",
  "description": "Mercenary working for the Magma syndicate. Skilled in blade combat and deception.",
  "abilities": ["Shadow Strike", "Blade Dance", "Smoke Bomb"],
  "image": "anime_girl_black_hair.png",
  "stats": {
    "strength": 75,
    "speed": 80,
    "defense": 70
  }
}`,

  magma: `{
  "name": "Magma",
  "role": "Final Boss",
  "description": "Leader of the villainous syndicate. Commands fire and heat with devastating power.",
  "abilities": ["Inferno Wave", "Magma Eruption", "Heat Shield"],
  "image": "demon_slayer_yellow_lace.png",
  "stats": {
    "strength": 95,
    "speed": 70,
    "defense": 90
  }
}`,

  mia: `{
  "name": "Mia Shiranui",
  "role": "Supporting Character",
  "description": "Temple guardian and Chun-Li's sister. Kidnapped during the diamond theft. Fights alongside Chun-Li in the final act.",
  "abilities": ["Flame Dance", "Fire Shield", "Phoenix Strike"],
  "image": "anime_girl_red_outfit_guardian.png",
  "stats": {
    "strength": 80,
    "speed": 85,
    "defense": 70
  }
}`,

  diamond: `{
  "name": "Diamond of Aeons",
  "type": "Sacred Artifact",
  "description": "Ancient diamond holding infinite energy, capable of rewriting destiny itself. Stolen from the Temple of Eternal Light.",
  "power_level": 100,
  "significance": "Central MacGuffin - drives entire plot",
  "current_location": "Unknown (with Magma syndicate)",
  "appearance": "Brilliant blue-white gem emanating ethereal light"
}`,

  graph: `{
  "nodes": [
    { "id": "scene_1", "type": "cutscene", "label": "Temple Intro" },
    { "id": "scene_2", "type": "gameplay", "label": "Villain Attacks" },
    { "id": "scene_3", "type": "cutscene", "label": "Chun-Li Returns" },
    { "id": "scene_4", "type": "cutscene", "label": "Madara Confrontation" },
    { "id": "scene_5", "type": "battle", "label": "Battle vs Madara", "branching": true },
    { "id": "scene_6a", "type": "cutscene", "label": "Outcome A - Lose" },
    { "id": "scene_6b", "type": "cutscene", "label": "Outcome B - Win" },
    { "id": "scene_7", "type": "gameplay", "label": "Journey Shadows" },
    { "id": "scene_8", "type": "boss", "label": "Magma Encounter" },
    { "id": "scene_9", "type": "cutscene", "label": "Rescue Mia", "end": true }
  ],
  "edges": [
    { "from": "scene_1", "to": "scene_2" },
    { "from": "scene_2", "to": "scene_3" },
    { "from": "scene_3", "to": "scene_4" },
    { "from": "scene_4", "to": "scene_5" },
    { "from": "scene_5", "to": "scene_6a", "condition": "defeat" },
    { "from": "scene_5", "to": "scene_6b", "condition": "victory" },
    { "from": "scene_6a", "to": "scene_7" },
    { "from": "scene_6b", "to": "scene_7" },
    { "from": "scene_7", "to": "scene_8" },
    { "from": "scene_8", "to": "scene_9" }
  ]
}`,
};
