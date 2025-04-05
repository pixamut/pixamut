FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD ["sh", "-c", "yarn start --port ${PORT}"]
