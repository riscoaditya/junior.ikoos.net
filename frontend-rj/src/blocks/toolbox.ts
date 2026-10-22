export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    { kind: 'category', name: '🚩', colour: '45', contents: [{ kind: 'block', type: 'event_start' }] },
    { kind: 'category', name: '➡️', colour: '210', contents: [{ kind: 'block', type: 'move_forward' }, { kind: 'block', type: 'jump_up' }, { kind: 'block', type: 'turn_right' }, { kind: 'block', type: 'turn_left' }] },
    { kind: 'category', name: '💬', colour: '300', contents: [{ kind: 'block', type: 'say_text' }, { kind: 'block', type: 'change_background' }, { kind: 'block', type: 'change_costume' }] },
    { kind: 'category', name: '🔊', colour: '20', contents: [{ kind: 'block', type: 'play_sound' }] },
    { kind: 'category', name: '🔁', colour: '120', contents: [{ kind: 'block', type: 'wait_seconds' }, { kind: 'block', type: 'repeat_times' }] },
  ],
};
