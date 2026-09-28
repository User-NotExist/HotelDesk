-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "dob" DATETIME,
    "sex" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "room_type" TEXT NOT NULL,
    "max_occupant" INTEGER NOT NULL,
    "is_out_of_service" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Stay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "arrival_date" DATETIME NOT NULL,
    "departure_date" DATETIME NOT NULL,
    "checked_in_at" DATETIME,
    "checked_out_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Stay_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StayGuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stay_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADDITIONAL',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,
    CONSTRAINT "StayGuest_stay_id_fkey" FOREIGN KEY ("stay_id") REFERENCES "Stay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StayGuest_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "Guest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE INDEX "Stay_room_id_status_arrival_date_departure_date_idx" ON "Stay"("room_id", "status", "arrival_date", "departure_date");

-- CreateIndex
CREATE INDEX "StayGuest_stay_id_guest_id_idx" ON "StayGuest"("stay_id", "guest_id");

-- CreateIndex
CREATE INDEX "StayGuest_guest_id_idx" ON "StayGuest"("guest_id");
