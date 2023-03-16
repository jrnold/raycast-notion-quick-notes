import { Action, ActionPanel, Form, popToRoot } from "@raycast/api";
import { useForm } from "@raycast/utils";

import { showToast, Toast } from "@raycast/api";
import { CreateRequest, createDatabasePage, Title } from "../utils/notion";
import { getPreferences } from "../utils/preferences";
import { markdownToBlocks } from "@tryfabric/martian";

interface NoteFormValues {
  title: string;
  content: string;
}

async function createNotesPage(values: NoteFormValues) {
  const titleLen = 50;
  const databaseId = getPreferences().databaseId;
  const children = values.content ? markdownToBlocks(values.content) : [];
  const title =
    values.title || values.content.length < titleLen
      ? values.content
      : values.content.slice(0, values.content.length - 3) + "...";
  const arg: CreateRequest = {
    parent: { database_id: databaseId },
    properties: { Name: Title(title) },
    children,
  };
  return await createDatabasePage(arg);
}

export function CreateNoteForm(): JSX.Element {
  const { handleSubmit, itemProps } = useForm<NoteFormValues>({
    async onSubmit(values) {
      try {
        const pageId = await createNotesPage(values);
        showToast({
          style: Toast.Style.Success,
          title: `Created note page ${pageId}`,
        });
      } catch (e) {
        showToast({
          style: Toast.Style.Failure,
          title: `Failed to create note page`,
        });
      }
      popToRoot();
    },
  });
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea title="Context" placeholder="Write notes here" enableMarkdown {...itemProps.content} />
      <Form.TextField title="Title" placeholder="Title" {...itemProps.title} />
    </Form>
  );
}
