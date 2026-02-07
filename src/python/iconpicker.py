import os
import re
import tempfile
import logging
import xml.dom.minidom
from typing import Union, Optional

# Try importing third-party libraries
try:
    import cairosvg
    from svgpathtools import svg2paths2
except ImportError as e:
    raise ImportError(f"Required library missing: {e}. Please install via '! pip install cairosvg svgpathtools'.")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class IconPicker:
    """
    A utility class for processing, resizing, and converting SVG icons.
    
    This class provides static methods to:
    - Resize SVG icons and normalize their viewBox.
    - specialized formatting for icons (adding styles, attributes).
    - Batch process directories of SVGs.
    - Convert SVGs to PNG format.
    """

    @staticmethod
    def _extract_dimensions(svg_attributes: dict) -> tuple[float, float]:
        """
        Extracts execution dimensions (width, height) from SVG attributes.
        
        Args:
            svg_attributes (dict): Dictionary of SVG root attributes.
            
        Returns:
            tuple[float, float]: The width and height of the SVG.
        """
        old_w, old_h = 100.0, 100.0

        if "viewBox" in svg_attributes:
            vb_parts = re.split(r"[ ,]+", svg_attributes["viewBox"].strip())
            if len(vb_parts) == 4:
                _, _, old_w, old_h = map(float, vb_parts)
        elif "width" in svg_attributes and "height" in svg_attributes:
            # removing units like px, %, etc.
            old_w = float(re.sub(r"[a-zA-Z%]", "", svg_attributes["width"]))
            old_h = float(re.sub(r"[a-zA-Z%]", "", svg_attributes["height"]))
            
        return old_w, old_h

    @staticmethod
    def _create_svg_dom(
        new_width: Union[int, float], 
        new_height: Union[int, float], 
        add_width_height: bool, 
        add_style: bool
    ) -> tuple[xml.dom.minidom.Document, xml.dom.minidom.Element]:
        """
        Creates the base SVG DOM structure.
        
        Returns:
            tuple: The DOM document and the root SVG element.
        """
        doc = xml.dom.minidom.Document()
        svg_node = doc.createElement("svg")
        svg_node.setAttribute("viewBox", f"0 0 {new_width} {new_height}")

        if add_width_height:
            svg_node.setAttribute("width", str(new_width))
            svg_node.setAttribute("height", str(new_height))

        svg_node.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        svg_node.setAttribute("fill", "currentColor")
        svg_node.setAttribute("style", "--icon-color:#D4D4D4; fill:var(--icon-color);")

        doc.appendChild(svg_node)

        if add_style:
            style_node = doc.createElement("style")
            style_node.appendChild(
                doc.createTextNode("\n  svg { --icon-color: #D4D4D4; }\n")
            )
            svg_node.appendChild(style_node)
            
        return doc, svg_node

    @staticmethod
    def _process_svg_logic(
        input_filepath: str,
        new_width: Union[int, float],
        new_height: Union[int, float],
        add_style: bool = False,
        add_width_height_attributes: bool = False,
        minify: bool = False
    ) -> str:
        """
        Internal logic to process the SVG file: read, parse, scale paths, and rebuild.
        
        Args:
            input_filepath (str): Path to the source SVG file.
            new_width (Union[int, float]): Desired width.
            new_height (Union[int, float]): Desired height.
            add_style (bool): Whether to inject default CSS styles.
            add_width_height_attributes (bool): Whether to add explicit width/height attrs.
            minify (bool): Whether to minify the output XML.
            
        Returns:
            str: The processed SVG content as a string.
        """
        if not os.path.exists(input_filepath):
            raise FileNotFoundError(f"The file {input_filepath} does not exist.")

        try:
            # Parse the SVG to get paths and attributes
            paths, _, svg_attr = svg2paths2(input_filepath)
        except Exception as e:
            raise ValueError(f"Failed to parse SVG file '{input_filepath}': {e}")

        # Determine original dimensions to calculate scale factor
        old_w, old_h = IconPicker._extract_dimensions(svg_attr)

        if old_w == 0 or old_h == 0:
            raise ValueError("Original SVG has 0 width or height, cannot scale.")

        scale_x = new_width / old_w
        scale_y = new_height / old_h

        # Build new SVG Document
        doc, svg_node = IconPicker._create_svg_dom(
            new_width, new_height, add_width_height_attributes, add_style
        )

        # Scale and add paths
        for path in paths:
            scaled_path = path.scaled(scale_x, scale_y)
            path_d = scaled_path.d()

            # Round coordinates to 2 decimal places to utilize space efficiently
            rounded_d = re.sub(
                r"(-?\d+\.\d+|-?\d+)",
                lambda m: format(round(float(m.group(0)), 2), "g"),
                path_d
            )

            path_node = doc.createElement("path")
            path_node.setAttribute("d", rounded_d)
            svg_node.appendChild(path_node)

        # Generate output string
        raw_xml = doc.toprettyxml(indent="  ") if not minify else doc.toprettyxml()
        
        # Clean up empty lines if pretty-printed
        if not minify:
            clean_xml = "\n".join(line for line in raw_xml.split("\n") if line.strip())
            return clean_xml
            
        return raw_xml

    @staticmethod
    def resize_and_format_svg(
        svg_content: str,
        new_width: Union[int, float],
        new_height: Union[int, float],
        add_style: bool = False,
        add_width_height_attributes: bool = False,
        minify: bool = False
    ) -> str:
        """
        Resizes and formats an SVG string content.

        Args:
            svg_content (str): The raw SVG content string.
            new_width (Union[int, float]): Target width.
            new_height (Union[int, float]): Target height.
            add_style (bool, optional): Add default style block. Defaults to False.
            add_width_height_attributes (bool, optional): Add width/height attributes. Defaults to False.
            minify (bool, optional): Minify output. Defaults to False.

        Returns:
            str: The processed SVG content.
        """
        # svg2paths2 requires a file on disk, so we use a temporary file.
        with tempfile.NamedTemporaryFile(mode='w', suffix='.svg', delete=False, encoding='utf-8') as tmp:
            tmp.write(svg_content)
            tmp_path = tmp.name
        
        try:
            return IconPicker._process_svg_logic(
                tmp_path, new_width, new_height, add_style, add_width_height_attributes, minify
            )
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    @staticmethod
    def resize_and_format_svg_file(
        input_filepath: str,
        output_filepath: str,
        new_width: Union[int, float],
        new_height: Union[int, float],
        add_style: bool = False,
        add_width_height_attributes: bool = False,
        minify: bool = False
    ) -> None:
        """
        Resizes and formats an SVG file and saves it to a new location.

        Args:
            input_filepath (str): Path to the source file.
            output_filepath (str): Path for the result file.
            new_width (Union[int, float]): Target width.
            new_height (Union[int, float]): Target height.
            add_style (bool, optional): Add default style block. Defaults to False.
            add_width_height_attributes (bool, optional): Add width/height attributes. Defaults to False.
            minify (bool, optional): Minify output. Defaults to False.
        """
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
        
        content = IconPicker._process_svg_logic(
            input_filepath, new_width, new_height, add_style, add_width_height_attributes, minify
        )

        with open(output_filepath, "w", encoding="utf-8") as f:
            f.write(content)
        
        logger.info(f"Processed: {input_filepath} -> {output_filepath}")

    @staticmethod
    def convert_to_png(
        svg_content: str,
        output_path: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        scale: Optional[float] = None
    ) -> None:
        """
        Converts an SVG string into a PNG file.

        Args:
            svg_content (str): The SVG XML content.
            output_path (str): The path to save the PNG file.
            width (int, optional): Output width. Defaults to None.
            height (int, optional): Output height. Defaults to None.
            scale (float, optional): Scaling factor. Defaults to None.
        """
        IconPicker._svg_string_to_png_bytes(svg_content, output_path, width, height, scale)

    @staticmethod
    def bulk_process(
        input_dir: str,
        output_subdir: str,
        target_width: Union[int, float],
        target_height: Union[int, float],
        add_style: bool = False,
        add_width_height_attributes: bool = False,
        minify: bool = False
    ) -> None:
        """
        Batch-process all SVG files in a given directory.

        Args:
            input_dir (str): Directory containing source SVGs.
            output_subdir (str): Name of the subdirectory to create within input_dir for outputs.
            target_width (Union[int, float]): Target width for all icons.
            target_height (Union[int, float]): Target height for all icons.
            add_style (bool, optional): Add default styles. Defaults to False.
            add_width_height_attributes (bool, optional): Add attributes. Defaults to False.
            minify (bool, optional): Minify output. Defaults to False.
        """
        if not os.path.exists(input_dir):
            raise FileNotFoundError(f"The folder {input_dir} does not exist.")

        output_dir = os.path.join(input_dir, output_subdir)
        os.makedirs(output_dir, exist_ok=True)

        # Filter for SVG files
        svg_files = [f for f in os.listdir(input_dir) if f.lower().endswith(".svg")]

        if not svg_files:
            logger.warning(f"No SVG files found in {input_dir}")
            return

        logger.info(f"Found {len(svg_files)} SVG files in {input_dir}. Starting processing...")

        for filename in svg_files:
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)

            try:
                IconPicker.resize_and_format_svg_file(
                    input_filepath=input_path,
                    output_filepath=output_path,
                    new_width=target_width,
                    new_height=target_height,
                    add_style=add_style,
                    add_width_height_attributes=add_width_height_attributes,
                    minify=minify
                )
            except Exception as e:
                logger.error(f"Failed to process {filename}: {e}")

        logger.info("Batch processing complete.")

    @staticmethod
    def _svg_string_to_png_bytes(
        svg_content: str,
        output_path: Optional[str] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        scale: Optional[float] = None
    ) -> bytes:
        """
        Internal conversion from SVG string to PNG bytes/file.
        """
        png_bytes = cairosvg.svg2png(
            bytestring=svg_content.encode("utf-8"),
            output_width=width,
            output_height=height,
            scale=scale
        )

        if output_path:
            # Create directory if needed
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(png_bytes)
            logger.info(f"Generated PNG: {output_path}")

        return png_bytes
