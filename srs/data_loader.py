import os
import logging
import pandas as pd
from tqdm import tqdm
from pathlib import Path
from src.config import DATA_DIR, REQUIRED_FILES

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def detect_csv_files(data_directory=DATA_DIR):
    """
    Automatically detects all CSV files in the specified directory.
    """
    path = Path(data_directory)
    if not path.exists():
        raise FileNotFoundError(f"Data directory {data_directory} does not exist.")
    
    csv_files = list(path.glob("*.csv"))
    logger.info(f"Detected {len(csv_files)} CSV files in {data_directory}")
    for file in csv_files:
        logger.info(f" - {file.name}")
    return csv_files

def load_datasets(data_directory=DATA_DIR):
    """
    Loads all detected CSV files into a dictionary of pandas DataFrames.
    """
    try:
        csv_files = detect_csv_files(data_directory)
        datasets = {}
        
        logger.info("Loading CSV files into pandas DataFrames...")
        for file_path in tqdm(csv_files, desc="Loading datasets"):
            name = file_path.stem
            try:
                # Load with default encoding first, fallback if it fails
                datasets[name] = pd.read_csv(file_path)
                logger.info(f"Loaded {name} successfully (Shape: {datasets[name].shape})")
            except UnicodeDecodeError:
                # Some files might have different encodings, fallback to latin-1
                datasets[name] = pd.read_csv(file_path, encoding='latin-1')
                logger.info(f"Loaded {name} successfully with latin-1 encoding (Shape: {datasets[name].shape})")
            except Exception as e:
                logger.error(f"Error loading {file_path.name}: {str(e)}")
                raise e
        
        # Verify required files are loaded
        missing = []
        for req in REQUIRED_FILES:
            stem = Path(req).stem
            if stem not in datasets:
                missing.append(req)
        
        if missing:
            logger.warning(f"The following expected files were not found: {missing}")
            
        return datasets
    except Exception as e:
        logger.error(f"Exception during dataset loading: {str(e)}")
        raise e

if __name__ == "__main__":
    print(f"Data Directory: {DATA_DIR}")
    dfs = load_datasets()
    print("Done! Keys loaded:", list(dfs.keys()))
