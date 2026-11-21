def test_dependencies_importable():
    import fastapi
    import pydantic
    import sklearn
    import pandas
    import joblib
    import pytest
    assert fastapi.__version__ is not None
