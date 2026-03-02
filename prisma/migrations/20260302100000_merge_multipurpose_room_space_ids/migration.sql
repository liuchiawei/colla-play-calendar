-- Merge deprecated space ids (room1/room2) into 4f-multipurpose-room.
-- Replaces 4f-multipurpose-room-1 and 4f-multipurpose-room-2 with 4f-multipurpose-room
-- and deduplicates the array. Only updates rows that contain at least one deprecated id.
UPDATE project_rental pr
SET "spaceIds" = sub.new_ids
FROM (
  SELECT pr2.id,
    array_agg(DISTINCT CASE
      WHEN elem = '4f-multipurpose-room-1' OR elem = '4f-multipurpose-room-2' THEN '4f-multipurpose-room'
      ELSE elem
    END) AS new_ids
  FROM project_rental pr2,
    unnest(pr2."spaceIds") AS elem
  GROUP BY pr2.id
) sub
WHERE pr.id = sub.id
  AND (pr."spaceIds" @> ARRAY['4f-multipurpose-room-1']::text[] OR pr."spaceIds" @> ARRAY['4f-multipurpose-room-2']::text[]);
