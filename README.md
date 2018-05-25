# NTU 2018 OS project 1 評測程式

## 版權聲明

本程式可免費提供修課學生自行測試，但若往後的 OS 助教想使用本程式（包括任何形式的修改、執行），請與我聯絡，將會酌收費用（花這筆錢絕對比花時間手動計算還要划算）。

## 前置準備

本評測程式依賴於 Node.js （版本 8.0 以上），請依[官網指示](https://nodejs.org/en/download/package-manager/)安裝。

下載本 repo ，並進入本 repo 目錄
``` sh
git clone https://github.com/MROS/2018-os-pj1-judge
cd 2018-os-pj1-judge
```

## 評測流程

評測分爲兩階段，先捕捉標準輸出與 dmesg 中的資訊，再對這些資訊進行評分。

1. 產生輸出

``` sh
cp [你的執行檔] .
mkdir output                             # 建立要輸出到的目錄
sudo node generate.js [你的執行檔] output  # 產生輸出
```
    
2. 評分

``` sh
node judge.js output
```

## To 下個助教

data/ 內部的測試資料可以隨意更改（學生可能會優化重複使用的測資），judge.js 會計算出正確資料並與學生的結果做比較。

目前版本的 spec 有很多模棱兩可之處，譬如開始時間並不明確，導致同學們之間實作不一致，但也無法說是誰對誰錯，只好捨棄以開始時間，僅僅以結束時間進行評分。請視狀況修改 spec ，同時把一些廢話刪掉， kernel 實在未必需要改。（如果可以把整個 project 打掉更好）