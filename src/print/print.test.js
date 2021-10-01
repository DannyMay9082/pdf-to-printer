"use strict";

import { existsSync } from "fs";
import { join } from "path";
import execAsync from "../utils/exec-file-async";
import fixPathForAsarUnpack from "../utils/electron-util";
import print from "./print";

jest.mock("fs");
jest.mock("path");
jest.mock("../utils/exec-file-async");
jest.mock("../utils/electron-util");

beforeEach(() => {
  // override the implementations
  fixPathForAsarUnpack.mockImplementation((path) => path);
  existsSync.mockImplementation(() => true);
  execAsync.mockImplementation(() => Promise.resolve());
  join.mockImplementation((_, filename) => "mocked_path_" + filename);
});

afterEach(() => {
  // restore the original implementations
  fixPathForAsarUnpack.mockRestore();
  existsSync.mockRestore();
  execAsync.mockRestore();
  join.mockRestore();
});

it("throws when no file is specified.", async () => {
  await expect(print()).rejects.toMatch("No PDF specified");
});

test("throws when path to the file is invalid", async () => {
  await expect(print(123)).rejects.toMatch("Invalid PDF name");
});

it("throws when file not found", async () => {
  existsSync.mockImplementation(() => false);

  await expect(print("file.txt")).rejects.toMatch("No such file");
});

it("sends the PDF file to the default printer", async () => {
  const filename = "assets/pdf-sample.pdf";

  await print(filename);

  expect(execAsync).toHaveBeenCalledWith("mocked_path_SumatraPDF.exe", [
    "-print-to-default",
    "-silent",
    filename,
  ]);
});

it("sends PDF file to the specific printer", async () => {
  const filename = "assets/pdf-sample.pdf";
  const printer = "Zebra";
  const options = { printer };

  await print(filename, options);

  expect(execAsync).toHaveBeenCalledWith("mocked_path_SumatraPDF.exe", [
    "-print-to",
    printer,
    "-silent",
    filename,
  ]);
});

it("sends PDF file to the specific printer with a space in its name", async () => {
  const filename = "assets/pdf-sample.pdf";
  const printer = "Microsoft Print to PDF";
  const options = { printer };

  await print(filename, options);

  expect(execAsync).toHaveBeenCalledWith("mocked_path_SumatraPDF.exe", [
    "-print-to",
    printer,
    "-silent",
    filename,
  ]);
});

it("allows users to pass OS specific options and a printer", async () => {
  const filename = "assets/pdf-sample.pdf";
  const printer = "Zebra";
  const options = { printer, win32: ['-print-settings "1,2,fit"'] };

  await print(filename, options);

  expect(execAsync).toHaveBeenCalledWith("mocked_path_SumatraPDF.exe", [
    "-print-settings",
    "1,2,fit",
    "-print-to",
    printer,
    "-silent",
    filename,
  ]);
});

it("allows users to pass OS specific options without a printer", async () => {
  const filename = "assets/pdf-sample.pdf";
  const options = { win32: ['-print-settings "1,3,fit"'] };
  await print(filename, options);

  expect(execAsync).toHaveBeenCalledWith("mocked_path_SumatraPDF.exe", [
    "-print-settings",
    "1,3,fit",
    "-print-to-default",
    "-silent",
    filename,
  ]);
});

it("does not set a printer when -print-dialog is set", async () => {
  const filename = "assets/pdf-sample.pdf";
  const options = { win32: ["-print-dialog", '-print-settings "1,4,fit"'] };

  await print(filename, options);

  expect(execAsync).toHaveBeenCalledWith("mocked_path_SumatraPDF.exe", [
    "-print-dialog",
    "-print-settings",
    "1,4,fit",
    filename,
  ]);
});

it("ignores the passed printer when -print-dialog is set", async () => {
  const filename = "assets/pdf-sample.pdf";
  const printer = "Zebra";
  const options = {
    printer,
    win32: ["-print-dialog", '-print-settings "1,4,fit"'],
  };

  await print(filename, options);

  expect(execAsync).toHaveBeenCalledWith("mocked_path_SumatraPDF.exe", [
    "-print-dialog",
    "-print-settings",
    "1,4,fit",
    filename,
  ]);
});

it("throws when options passed not as an array.", async () => {
  const filename = "assets/pdf-sample.pdf";
  const options = { win32: '-print-settings "fit"' };
  await expect(print(filename, options)).rejects.toMatch(
    "options.win32 should be an array"
  );
});

it("works when custom SumatraPDF path specified", async () => {
  const mockedSumatraPdfPath = "mocked_SumatraPDF.exe";
  const filename = "assets/pdf-sample.pdf";

  await print(filename, { sumatraPdfPath: mockedSumatraPdfPath });

  expect(execAsync).toHaveBeenCalledWith(mockedSumatraPdfPath, [
    "-print-to-default",
    "-silent",
    filename,
  ]);
});
