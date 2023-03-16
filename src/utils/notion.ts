import { Client, isNotionClientError } from "@notionhq/client";
import { getPreferences } from "./preferences";
import { showToast, Toast } from "@raycast/api";
import { markdownToBlocks } from "@tryfabric/martian";
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";

export function Title(text: string): { title: { text: { content: string } }[] } {
  return {
    title: [{ text: { content: text } }],
  };
}

// Notion client with auth
export const NotionClient = () => {
  return new Client({
    auth: getPreferences().apiKey,
  });
};

export type CreateRequest = Parameters<typeof Client.prototype.pages.create>[0];

export async function createDatabasePage(arg: CreateRequest): Promise<CreatePageResponse | null> {
  try {
    const client = NotionClient();
    return await client.pages.create(arg);
  } catch (err: unknown) {
    console.error(err);
    if (isNotionClientError(err)) {
      showToast({
        style: Toast.Style.Failure,
        title: err.message,
      });
      return null;
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to create page",
      });
      return null;
    }
  }
}

export async function appendToPage(pageId: string, content: string): Promise<void> {
  try {
    const notion = NotionClient();
    const arg: Parameters<typeof notion.blocks.children.append>[0] = {
      block_id: pageId,
      children: markdownToBlocks(content),
    };
    await notion.blocks.children.append(arg);
  } catch (err: unknown) {
    console.error(err);
    if (isNotionClientError(err)) {
      showToast({
        style: Toast.Style.Failure,
        title: err.message,
      });
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to add content to the page",
      });
    }
  }
}
