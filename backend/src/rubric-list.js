import Rubric from './rubric.js';

export default async function rubricListHandler(req, res) {
  try {
    const rubrics = await Rubric.find({}, '_id name');
    res.json(rubrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rubrics', details: err.message });
  }
}
