from PIL import Image

def make_white_transparent(image_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    newData = []
    # threshold for considering "white"
    for item in datas:
        # if the pixel is white or almost white (e.g. R, G, B > 240)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(image_path, "PNG")

if __name__ == "__main__":
    make_white_transparent("public/college-logo.png")
    print("Done")
