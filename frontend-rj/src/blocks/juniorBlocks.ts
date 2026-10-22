import * as Blockly from 'blockly';

export function registerJuniorBlocks() {
  Blockly.Blocks['event_start'] = {
    init: function () {
      this.appendDummyInput().appendField('🚩  MULAI');
      this.setNextStatement(true);
      this.setColour(45);
      this.setTooltip('Program dimulai dari block ini.');
    }
  };

  Blockly.Blocks['move_forward'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('➡️')
        .appendField(new Blockly.FieldNumber(50, 10, 300, 10), 'STEPS')
        .appendField('langkah');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(210);
    }
  };



  Blockly.Blocks['jump_up'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🦘')
        .appendField(new Blockly.FieldNumber(80, 20, 180, 10), 'HEIGHT')
        .appendField('lompat');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(210);
    }
  };

  Blockly.Blocks['turn_right'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('↪️')
        .appendField(new Blockly.FieldNumber(90, 15, 360, 15), 'DEGREES')
        .appendField('putar');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(210);
    }
  };

  Blockly.Blocks['turn_left'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('↩️')
        .appendField(new Blockly.FieldNumber(90, 15, 360, 15), 'DEGREES')
        .appendField('putar');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(210);
    }
  };

  Blockly.Blocks['say_text'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('💬')
        .appendField(new Blockly.FieldTextInput('Halo!'), 'TEXT');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(300);
    }
  };

  Blockly.Blocks['play_sound'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🔊')
        .appendField(new Blockly.FieldDropdown([
          ['Salam', 'salam'],
          ['Pop', 'pop'],
          ['Hebat', 'success'],
        ]), 'SOUND');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(20);
    }
  };

  Blockly.Blocks['change_background'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🌈')
        .appendField(new Blockly.FieldDropdown([
          ['Masjid Ceria', 'masjid-ceria'],
          ['Taman Bermain', 'taman'],
          ['Kelas IKOOS', 'kelas'],
        ]), 'BACKGROUND');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(300);
    }
  };

  Blockly.Blocks['change_costume'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🙂')
        .appendField(new Blockly.FieldDropdown([
          ['Anak Muslim', 'anak-muslim'],
          ['Anak Ceria', 'anak-muslim-2'],
          ['Kucing Lucu', 'kucing'],
        ]), 'CHARACTER');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(300);
    }
  };

  Blockly.Blocks['wait_seconds'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('⏳')
        .appendField(new Blockly.FieldNumber(1, 0.5, 10, 0.5), 'SECONDS')
        .appendField('detik');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
    }
  };

  Blockly.Blocks['repeat_times'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🔁')
        .appendField(new Blockly.FieldNumber(2, 1, 10, 1), 'TIMES')
        .appendField('kali');
      this.appendStatementInput('DO').appendField('👇');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
    }
  };
}
