export const starterXml = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_start" x="24" y="24">
    <next>
      <block type="say_text">
        <field name="TEXT">Assalamu'alaikum!</field>
        <next>
          <block type="move_forward">
            <field name="STEPS">80</field>
            <next>
              <block type="play_sound">
                <field name="SOUND">success</field>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;
