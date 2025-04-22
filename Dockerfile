FROM denoland/deno:bin-2.2.11 as deno

FROM node:22.14-bookworm-slim
COPY --from=deno /deno /usr/local/bin/deno

RUN export PATH=$PATH:/usr/local/bin/deno

# Set default working directory
WORKDIR /app

# Install dependencies
## Add deno.json and package.json files first to leverage Docker cache
COPY package.json package-lock.json ./
COPY deno.json ./

## Use npm to install dependencies via deno task
RUN deno task install

# Copy source code
COPY lib ./lib
COPY src ./src
COPY dat ./dat
# Default command
CMD ["deno", "task", "main", ""]