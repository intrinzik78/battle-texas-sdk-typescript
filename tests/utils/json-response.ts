export function jsonResponse(body: unknown,status = 200,contentType = "application/json") {
  const textBody =
    typeof body === "string"
      ? body
      : body === undefined
        ? ""
        : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string) {
        return name.toLowerCase() === "content-type" ? contentType : null;
      }
    },
    async text() {
      return textBody;
    },
    async json() {
      return body;
    }
  } as any;
}
