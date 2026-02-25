-- Migration: Update treatment images with unique, relevant photos per service
-- Each treatment now has a distinct Unsplash image related to its specific procedure

-- TRATAMIENTOS FACIALES
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1643685276743-1b52832c58d5?w=400&h=300&fit=crop' WHERE name = 'HIFU Facial';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1661255439358-f919d18088b2?w=400&h=300&fit=crop' WHERE name = 'Limpieza Facial Profunda';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1611169035510-f9af52e6dbe2?w=400&h=300&fit=crop' WHERE name ILIKE '%Microdermoabrasi%n Facial%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1693004925174-d9e06209d0ee?w=400&h=300&fit=crop' WHERE name = 'Transdermoterapia';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1661668899324-3549b48e58a6?w=400&h=300&fit=crop' WHERE name = 'Dermapen';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1654430343142-2d6157e69887?w=400&h=300&fit=crop' WHERE name = 'Mesoterapia Facial';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1643684460412-76908d8e5a25?w=400&h=300&fit=crop' WHERE name = 'Peelings Faciales';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1693004927824-f2623bbedc8b?w=400&h=300&fit=crop' WHERE name = 'Tratamiento para Espinillas';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1723708995578-dfdbecf03c33?w=400&h=300&fit=crop' WHERE name = 'Tratamiento para Manchas';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1616117690865-1aadc7aa6666?w=400&h=300&fit=crop' WHERE name = 'Rejuvenecimiento Lifting Facial';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1510511293580-9d525c6d8913?w=400&h=300&fit=crop' WHERE name = 'Rellenos Faciales';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1635187103184-6601bdd547b5?w=400&h=300&fit=crop' WHERE name ILIKE '%Toxina Botul%nica%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1637904145523-2b598dab9e62?w=400&h=300&fit=crop' WHERE name = 'Hilos Tensores Facial';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1642980596802-08bf6172d993?w=400&h=300&fit=crop' WHERE name ILIKE '%Inducci%n de Col%geno%';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1734468932556-bd0a107c182a?w=400&h=300&fit=crop' WHERE name = 'Radiofrecuencia Facial';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1661295770914-090b07d3e92d?w=400&h=300&fit=crop' WHERE name = 'Aumento de Labios';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1654374504608-67c4cfe65fca?w=400&h=300&fit=crop' WHERE name = 'Perfilado de Nariz';

-- TRATAMIENTOS CORPORALES
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1682097032813-79ba61ff791f?w=400&h=300&fit=crop' WHERE name = 'Emsculpt';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1632057828761-4944fab0600e?w=400&h=300&fit=crop' WHERE name ILIKE '%Estr%as%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1743404024609-b61890122df7?w=400&h=300&fit=crop' WHERE name ILIKE '%Celulitis%';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1661505071420-1f10ce4108e0?w=400&h=300&fit=crop' WHERE name ILIKE '%Varices%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1541752857837-f8a0154fd092?w=400&h=300&fit=crop' WHERE name ILIKE '%Lipol%ser%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1670201203116-26644750a726?w=400&h=300&fit=crop' WHERE name ILIKE '%Alopecia%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1610103410996-db632ef921aa?w=400&h=300&fit=crop' WHERE name ILIKE '%Hiperhidrosis%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400&h=300&fit=crop' WHERE name = 'Vacuumterapia';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1728497872607-fa0b98a3eb79?w=400&h=300&fit=crop' WHERE name ILIKE '%Flacidez Corporal%';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1675502958231-2afa30d16d23?w=400&h=300&fit=crop' WHERE name ILIKE '%Drenaje Linf%tico%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1649751295468-953038600bef?w=400&h=300&fit=crop' WHERE name = 'Peelings Corporales';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1665703156181-b92723e119a2?w=400&h=300&fit=crop' WHERE name ILIKE '%Cicatrices%';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1661598127858-a74fb8879140?w=400&h=300&fit=crop' WHERE name ILIKE '%Ultracavitaci%n%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1620051844584-15ac31d5fccd?w=400&h=300&fit=crop' WHERE name ILIKE '%Blanqueamiento Corporal%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1677682693087-711e24efaa69?w=400&h=300&fit=crop' WHERE name = 'Radiofrecuencia Corporal';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=400&h=300&fit=crop' WHERE name ILIKE '%Queloides%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1542848285-4777eb2a621e?w=400&h=300&fit=crop' WHERE name ILIKE '%Exfoliaciones%Envolturas%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=400&h=300&fit=crop' WHERE name ILIKE '%Microdermoabrasi%n Corporal%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1611073615452-4889cb93422e?w=400&h=300&fit=crop' WHERE name ILIKE '%Reductores de Grasa%';
UPDATE treatments SET image_url = 'https://plus.unsplash.com/premium_photo-1661600526264-764fb2c40f56?w=400&h=300&fit=crop' WHERE name ILIKE '%Masajes%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1672454158574-5f978761d872?w=400&h=300&fit=crop' WHERE name ILIKE '%Electrocauterizaci%n%Verrugas%';
UPDATE treatments SET image_url = 'https://images.unsplash.com/photo-1650044252595-cacd425982ff?w=400&h=300&fit=crop' WHERE name ILIKE '%Factores de Crecimiento%';
