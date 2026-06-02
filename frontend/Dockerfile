FROM node:20-alpine as build  
WORKDIR /app  
COPY package*.json ./  
RUN npm ci  
COPY . .  
RUN npm run build  
  
FROM node:20-alpine  
WORKDIR /app  
COPY --from=build /app/dist ./dist  
COPY package*.json ./  
RUN npm ci --only=production  
COPY . .  
  
EXPOSE 5173  
  
CMD ["npm", "run", "preview"]
