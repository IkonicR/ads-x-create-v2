ALTER TABLE styles
ADD COLUMN style_cues TEXT[] DEFAULT '{}',
ADD COLUMN avoid TEXT[] DEFAULT '{}';
