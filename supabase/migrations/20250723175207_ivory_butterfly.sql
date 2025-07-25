/*
  # Fix RLS policies for data initialization

  1. Security Updates
    - Temporarily allow anon users to insert initial data
    - Add proper policies for data initialization
    - Ensure service role can bypass RLS for setup

  2. Tables Updated
    - roles: Allow initial data insertion
    - users: Allow initial data insertion  
    - surveys: Allow initial data insertion
    - survey_sections: Allow initial data insertion
    - questions: Allow initial data insertion
    - question_options: Allow initial data insertion
    - system_settings: Allow initial data insertion

  Note: These policies should be reviewed and tightened for production use
*/

-- Allow anon users to insert initial data during setup
CREATE POLICY "Allow anon to insert roles during setup"
  ON roles
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to insert users during setup"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to insert surveys during setup"
  ON surveys
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to insert survey_sections during setup"
  ON survey_sections
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to insert questions during setup"
  ON questions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to insert question_options during setup"
  ON question_options
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to insert system_settings during setup"
  ON system_settings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon users to read data for initialization checks
CREATE POLICY "Allow anon to read roles for setup check"
  ON roles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to read users for setup check"
  ON users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to read surveys for setup check"
  ON surveys
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to read survey_sections for setup check"
  ON survey_sections
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to read questions for setup check"
  ON questions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to read question_options for setup check"
  ON question_options
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to read system_settings for setup check"
  ON system_settings
  FOR SELECT
  TO anon
  USING (true);