import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import {
  Authenticator,
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl, remove } from "aws-amplify/storage";

Amplify.configure(outputs);
const client = generateClient();

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
  });


  async function fetchNotes() {
    const { data } = await client.models.Note.list();
    const notesWithUrls = await Promise.all(
      data.map(async (note) => {
        if (note.image) {
          const url = await getUrl({ path: note.image });
          return { ...note, imageUrl: url.url.toString() };
        }
        return note;
      })
    );
    setNotes(notesWithUrls);
  }

  async function createNote(e) {
    e.preventDefault();
    let imagePath = null;

    if (formData.image) {
      imagePath = `media/${crypto.randomUUID()}/${formData.image.name}`;
      await uploadData({
        path: imagePath,
        data: formData.image,
      }).result;
    }

    await client.models.Note.create({
      name: formData.name,
      description: formData.description,
      image: imagePath,
    });

    setFormData({ name: "", description: "", image: null });
    fetchNotes();
  }


  async function deleteNote(id, imagePath) {
    await client.models.Note.delete({ id });
    if (imagePath) {
      await remove({ path: imagePath });
    }
    fetchNotes();
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <Flex direction="column" align="center" padding="2rem">
            <Heading level={2}>Hello, {user?.signInDetails?.loginId}</Heading>
            <Button onClick={signOut}>Sign Out</Button>

            <View as="form" marginTop="2rem" onSubmit={createNote}>
              <TextField
                placeholder="Note name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <TextField
                placeholder="Note description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.files[0] })
                }
              />
              <Button type="submit" variation="primary">
                Create Note
              </Button>
            </View>

            <Heading level={3} marginTop="2rem">
              Notes
            </Heading>
            <Flex wrap="wrap" gap="1rem">
              {notes.map((note) => (
                <View
                  key={note.id}
                  border="1px solid #ccc"
                  padding="1rem"
                  borderRadius="8px"
                  width="200px"
                >
                  <Text>{note.name}</Text>
                  <Text>{note.description}</Text>
                  {note.imageUrl && (
                    <Image
                      src={note.imageUrl}
                      alt={note.name}
                      width="100%"
                      height="150px"
                      objectFit="cover"
                    />
                  )}
                  <Button
                    size="small"
                    variation="destructive"
                    onClick={() => deleteNote(note.id, note.image)}
                  >
                    Delete
                  </Button>
                </View>
              ))}
            </Flex>
          </Flex>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
