FROM node:18-alpine

WORKDIR /app

# We don't install dependencies here because in dev mode 
# we usually mount the volume and run npm install locally,
# but for a complete docker setup we can do it:
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
