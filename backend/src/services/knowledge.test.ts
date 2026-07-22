import assert from "node:assert/strict";
import test from "node:test";

import { retrieveCampusKnowledge, tokenize } from "./knowledge";

test("tokenizer removes filler words", () => {
  assert.deepEqual(tokenize("What is in the Computer Science building?"), [
    "computer",
    "science",
    "building",
  ]);
});

test("retrieval grounds a computer science question in the matching stop", () => {
  const sources = retrieveCampusKnowledge(
    "What happens in the computer science building?",
    "missouri-s-and-t",
  );
  assert.equal(sources[0]?.id, "stop:computer-science-building");
  assert.match(sources[0]?.content ?? "", /artificial intelligence, cybersecurity/i);
});

test("current stop receives context even for a vague question", () => {
  const sources = retrieveCampusKnowledge(
    "Tell me about this place",
    "missouri-s-and-t",
    "havener-center",
  );
  assert.equal(sources[0]?.id, "stop:havener-center");
});

test("retrieval finds an official campus place by a common alias", () => {
  const sources = retrieveCampusKnowledge(
    "Where is ECE?",
    "missouri-s-and-t",
  );
  assert.equal(sources[0]?.id, "place:emerson-electric-company-hall");
  assert.match(sources[0]?.content ?? "", /Electrical and Computer Engineering/i);
  assert.match(sources[0]?.sourceUrl ?? "", /^https:\/\//);
});

test("retrieval includes housing and landmark records", () => {
  const housing = retrieveCampusKnowledge("Tell me about RC1", "missouri-s-and-t");
  assert.equal(housing[0]?.id, "place:residential-commons-1");

  const landmark = retrieveCampusKnowledge("Where is Stonehenge?", "missouri-s-and-t");
  assert.equal(landmark[0]?.id, "place:stonehenge");
});

test("short aliases do not match inside unrelated words", () => {
  const civil = retrieveCampusKnowledge("Where is civil engineering?", "missouri-s-and-t");
  assert.equal(civil[0]?.id, "place:butler-carlton-civil-engineering-hall");
});

test("service names outrank generic student-center matches", () => {
  const health = retrieveCampusKnowledge(
    "Where is the student health center?",
    "missouri-s-and-t",
  );
  assert.equal(health[0]?.id, "place:student-health-complex");
});
