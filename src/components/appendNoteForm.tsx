import { Action, ActionPanel, Form, popToRoot } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { showToast, Toast } from "@raycast/api";
import { appendToPage, NotionClient, createDatabasePage, Title, CreateRequest } from "../utils/notion";
import { getPreferences } from "../utils/preferences";

interface AppendNoteFormValues {
  content: string;
}

async function createNewNotesPage(): Promise<string | null> {
  const databaseId = getPreferences().databaseId;
  const today = currentDate();
  const formattedDate = today.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const arg: CreateRequest = {
    parent: { database_id: databaseId },
    properties: { Name: Title(`${formattedDate} - Notes`), Tags: { multi_select: [{ name: "daily" }] } },
  };
  const response = await createDatabasePage(arg);
  return !response ? null : response.id;
}

// get the current date in YYYY-MM-DD format for the current time zone
function currentDate() {
  // get the current date in the system timezone
  const now = new Date();

  // set the time to the start of the day
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // set the time to the end of the day
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // get the UTC times for the start and end of the day
  const utcStart = startOfDay.toISOString();
  const utcEnd = endOfDay.toISOString();

  return { date: now, utcStart, utcEnd };
}

async function retrieveNotesPage(): Promise<string | null> {
  const notion = NotionClient();
  const databaseId = getPreferences().databaseId;
  const today = currentDate();
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        {
          timestamp: "created_time",
          created_time: {
            on_or_after: today.utcStart,
          },
        },
        {
          timestamp: "created_time",
          created_time: {
            on_or_before: today.utcEnd,
          },
        },
        {
          property: "Tags",
          multi_select: { contains: "daily" },
        },
      ],
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 1,
  });
  let page_id: string | null = null;
  if (response.results.length > 0) {
    console.log("Appending to page: " + response.results[0].id);
    page_id = response.results[0].id;
  } else {
    console.log(`No page found for ${today.utcStart}`);
  }
  return page_id;
}

async function getOrCreateNotesPage(): Promise<string | null> {
  return (await retrieveNotesPage()) || (await createNewNotesPage());
}

export function AppendNoteForm(): JSX.Element {
  const { handleSubmit, itemProps } = useForm<AppendNoteFormValues>({
    async onSubmit() {
      const pageId = await getOrCreateNotesPage();
      if (pageId) {
        if (itemProps.content.value) {
          await appendToPage(pageId, itemProps.content.value);
          console.log(`Appended to page: ${pageId})`);
        } else {
          showToast({
            style: Toast.Style.Failure,
            title: `Nothing to append.`,
          });
        }
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
      <Form.TextArea title="Content" placeholder="Write notes here" enableMarkdown {...itemProps.content} />
    </Form>
  );
}
